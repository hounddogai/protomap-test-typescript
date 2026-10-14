import * as text from "../../../../kit/text.js";

/** Where a strict pacing adjustment is in its life cycle. */
export type StrictPacingAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict pacing adjustment, with what the planners need to act on it. */
export class StrictPacingAdjustment {
  code: string;
  name: string;
  revision: number;
  clicks: number;
  campaignRef: string;
  approved: boolean;
  status: StrictPacingAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    clicks: number,
    campaignRef: string,
    approved: boolean,
    status: StrictPacingAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPacingAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPacingAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict pacing adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round(this.revision * this.clicks * 100) / 100;
  }

  copy(): StrictPacingAdjustment {
    return new StrictPacingAdjustment(
      this.code,
      this.name,
      this.revision,
      this.clicks,
      this.campaignRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict pacing adjustment in status open. */
export function newStrictPacingAdjustment(code: string, name: string): StrictPacingAdjustment {
  return new StrictPacingAdjustment(code, name, 0, 0, "", false, "open");
}

import * as text from "../../../../kit/text.js";

/** Where a rolling funnel threshold is in its life cycle. */
export type RollingFunnelThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling funnel threshold and its current status. */
export class RollingFunnelThreshold {
  code: string;
  title: string;
  campaignRef: string;
  unit: string;
  approved: boolean;
  score: number;
  status: RollingFunnelThresholdStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    unit: string,
    approved: boolean,
    score: number,
    status: RollingFunnelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.approved = approved;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFunnelThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingFunnelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling funnel threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RollingFunnelThreshold {
    return new RollingFunnelThreshold(
      this.code,
      this.title,
      this.campaignRef,
      this.unit,
      this.approved,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling funnel threshold in status created. */
export function newRollingFunnelThreshold(code: string, title: string): RollingFunnelThreshold {
  return new RollingFunnelThreshold(code, title, "", "", false, 0, "created");
}

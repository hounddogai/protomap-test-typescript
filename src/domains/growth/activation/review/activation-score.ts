import * as text from "../../../../kit/text.js";

/** Where a activation score is in its life cycle. */
export type ActivationScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A activation score. Its code is unique within a tenant. */
export class ActivationScore {
  code: string;
  label: string;
  approved: boolean;
  batchSize: number;
  clicks: number;
  durationMinutes: number;
  status: ActivationScoreStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    batchSize: number,
    clicks: number,
    durationMinutes: number,
    status: ActivationScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.batchSize = batchSize;
    this.clicks = clicks;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ActivationScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ActivationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.durationMinutes + this.clicks) * 100) / 100;
  }

  copy(): ActivationScore {
    return new ActivationScore(
      this.code,
      this.label,
      this.approved,
      this.batchSize,
      this.clicks,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation score in status open. */
export function newActivationScore(code: string, label: string): ActivationScore {
  return new ActivationScore(code, label, false, 0, 0, 0, "open");
}

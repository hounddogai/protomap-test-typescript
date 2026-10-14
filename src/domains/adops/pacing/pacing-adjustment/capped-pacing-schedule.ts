import * as text from "../../../../kit/text.js";

/** Where a capped pacing schedule is in its life cycle. */
export type CappedPacingScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped pacing schedule as the pacing team keeps it. */
export class CappedPacingSchedule {
  code: string;
  label: string;
  maximum: number;
  clicks: number;
  score: number;
  status: CappedPacingScheduleStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    clicks: number,
    score: number,
    status: CappedPacingScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.clicks = clicks;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPacingScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPacingScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped pacing schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped pacing schedule"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.clicks * this.score * 100) / 100;
  }

  copy(): CappedPacingSchedule {
    return new CappedPacingSchedule(this.code, this.label, this.maximum, this.clicks, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped pacing schedule in status proposed. */
export function newCappedPacingSchedule(code: string, label: string): CappedPacingSchedule {
  return new CappedPacingSchedule(code, label, 0, 0, 0, "proposed");
}

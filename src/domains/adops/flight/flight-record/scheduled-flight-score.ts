import * as text from "../../../../kit/text.js";

/** Where a scheduled flight score is in its life cycle. */
export type ScheduledFlightScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled flight score. Its code is unique within a tenant. */
export class ScheduledFlightScore {
  code: string;
  title: string;
  approved: boolean;
  floorValue: number;
  cohort: string;
  status: ScheduledFlightScoreStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    floorValue: number,
    cohort: string,
    status: ScheduledFlightScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.floorValue = floorValue;
    this.cohort = cohort;
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

  canMoveTo(next: ScheduledFlightScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFlightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled flight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): ScheduledFlightScore {
    return new ScheduledFlightScore(this.code, this.title, this.approved, this.floorValue, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled flight score in status proposed. */
export function newScheduledFlightScore(code: string, title: string): ScheduledFlightScore {
  return new ScheduledFlightScore(code, title, false, 0, "", "proposed");
}

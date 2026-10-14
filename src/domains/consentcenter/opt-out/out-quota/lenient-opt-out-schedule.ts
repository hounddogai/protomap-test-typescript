import * as text from "../../../../kit/text.js";

/** Where a lenient opt out schedule is in its life cycle. */
export type LenientOptOutScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient opt out schedule. Its code is unique within a tenant. */
export class LenientOptOutSchedule {
  code: string;
  name: string;
  durationMinutes: number;
  limit: number;
  segment: string;
  frequencyCap: number;
  status: LenientOptOutScheduleStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    limit: number,
    segment: string,
    frequencyCap: number,
    status: LenientOptOutScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.limit = limit;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: LenientOptOutScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: LenientOptOutScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient opt out schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient opt out schedule"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.limit + this.frequencyCap) * 100) / 100;
  }

  copy(): LenientOptOutSchedule {
    return new LenientOptOutSchedule(
      this.code,
      this.name,
      this.durationMinutes,
      this.limit,
      this.segment,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient opt out schedule in status proposed. */
export function newLenientOptOutSchedule(code: string, name: string): LenientOptOutSchedule {
  return new LenientOptOutSchedule(code, name, 0, 0, "", 0, "proposed");
}

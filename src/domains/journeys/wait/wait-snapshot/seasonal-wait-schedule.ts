import * as text from "../../../../kit/text.js";

/** Where a seasonal wait schedule is in its life cycle. */
export type SeasonalWaitScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal wait schedule as the wait team keeps it. */
export class SeasonalWaitSchedule {
  code: string;
  title: string;
  sequence: number;
  segment: string;
  description: string;
  updatedAt: number;
  status: SeasonalWaitScheduleStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    segment: string,
    description: string,
    updatedAt: number,
    status: SeasonalWaitScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.segment = segment;
    this.description = description;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalWaitScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalWaitScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal wait schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence + this.updatedAt) * 100) / 100;
  }

  copy(): SeasonalWaitSchedule {
    return new SeasonalWaitSchedule(
      this.code,
      this.title,
      this.sequence,
      this.segment,
      this.description,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal wait schedule in status requested. */
export function newSeasonalWaitSchedule(code: string, title: string): SeasonalWaitSchedule {
  return new SeasonalWaitSchedule(code, title, 0, "", "", 0, "requested");
}

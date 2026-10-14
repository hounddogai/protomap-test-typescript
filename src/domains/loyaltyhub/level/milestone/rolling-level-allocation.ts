import * as text from "../../../../kit/text.js";

/** Where a rolling level allocation is in its life cycle. */
export type RollingLevelAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling level allocation. Its code is unique within a tenant. */
export class RollingLevelAllocation {
  code: string;
  title: string;
  attempts: number;
  category: string;
  pinned: boolean;
  timezone: string;
  endsAt: number;
  cohort: string;
  score: number;
  audienceId: string;
  status: RollingLevelAllocationStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    category: string,
    pinned: boolean,
    timezone: string,
    endsAt: number,
    cohort: string,
    score: number,
    audienceId: string,
    status: RollingLevelAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.category = category;
    this.pinned = pinned;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.cohort = cohort;
    this.score = score;
    this.audienceId = audienceId;
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

  canMoveTo(next: RollingLevelAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingLevelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling level allocation"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts + this.score) * 100) / 100;
  }

  copy(): RollingLevelAllocation {
    return new RollingLevelAllocation(
      this.code,
      this.title,
      this.attempts,
      this.category,
      this.pinned,
      this.timezone,
      this.endsAt,
      this.cohort,
      this.score,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling level allocation in status proposed. */
export function newRollingLevelAllocation(code: string, title: string): RollingLevelAllocation {
  return new RollingLevelAllocation(code, title, 0, "", false, "", 0, "", 0, "", "proposed");
}

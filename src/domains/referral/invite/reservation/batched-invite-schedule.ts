import * as text from "../../../../kit/text.js";

/** Where a batched invite schedule is in its life cycle. */
export type BatchedInviteScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched invite schedule, with what the planners need to act on it. */
export class BatchedInviteSchedule {
  code: string;
  title: string;
  score: number;
  ownerId: string;
  timezone: string;
  variant: string;
  audienceId: string;
  startsAt: number;
  currency: string;
  utmSource: string;
  discount: number;
  status: BatchedInviteScheduleStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    ownerId: string,
    timezone: string,
    variant: string,
    audienceId: string,
    startsAt: number,
    currency: string,
    utmSource: string,
    discount: number,
    status: BatchedInviteScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.variant = variant;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.currency = currency;
    this.utmSource = utmSource;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInviteScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedInviteScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched invite schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched invite schedule"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.score * this.startsAt * 100) / 100;
  }

  copy(): BatchedInviteSchedule {
    return new BatchedInviteSchedule(
      this.code,
      this.title,
      this.score,
      this.ownerId,
      this.timezone,
      this.variant,
      this.audienceId,
      this.startsAt,
      this.currency,
      this.utmSource,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched invite schedule in status new. */
export function newBatchedInviteSchedule(code: string, title: string): BatchedInviteSchedule {
  return new BatchedInviteSchedule(code, title, 0, "", "", "", "", 0, "", "", 0, "new");
}

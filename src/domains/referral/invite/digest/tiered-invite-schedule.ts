import * as text from "../../../../kit/text.js";

/** Where a tiered invite schedule is in its life cycle. */
export type TieredInviteScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tiered invite schedule, with what the planners need to act on it. */
export class TieredInviteSchedule {
  code: string;
  title: string;
  clicks: number;
  reviewer: string;
  pinned: boolean;
  status: TieredInviteScheduleStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    reviewer: string,
    pinned: boolean,
    status: TieredInviteScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.reviewer = reviewer;
    this.pinned = pinned;
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

  canMoveTo(next: TieredInviteScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredInviteScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered invite schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): TieredInviteSchedule {
    return new TieredInviteSchedule(this.code, this.title, this.clicks, this.reviewer, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered invite schedule in status new. */
export function newTieredInviteSchedule(code: string, title: string): TieredInviteSchedule {
  return new TieredInviteSchedule(code, title, 0, "", false, "new");
}

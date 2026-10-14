import * as text from "../../../../kit/text.js";

/** Where a scheduled payout notice is in its life cycle. */
export type ScheduledPayoutNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One scheduled payout notice, with what the planners need to act on it. */
export class ScheduledPayoutNotice {
  code: string;
  title: string;
  campaignRef: string;
  archived: boolean;
  conversionRate: number;
  limit: number;
  locale: string;
  retries: number;
  status: ScheduledPayoutNoticeStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    archived: boolean,
    conversionRate: number,
    limit: number,
    locale: string,
    retries: number,
    status: ScheduledPayoutNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.limit = limit;
    this.locale = locale;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPayoutNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPayoutNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled payout notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled payout notice"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.limit * this.retries * 100) / 100;
  }

  copy(): ScheduledPayoutNotice {
    return new ScheduledPayoutNotice(
      this.code,
      this.title,
      this.campaignRef,
      this.archived,
      this.conversionRate,
      this.limit,
      this.locale,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled payout notice in status idle. */
export function newScheduledPayoutNotice(code: string, title: string): ScheduledPayoutNotice {
  return new ScheduledPayoutNotice(code, title, "", false, 0, 0, "", 0, "idle");
}

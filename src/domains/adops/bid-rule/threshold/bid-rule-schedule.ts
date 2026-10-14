import * as text from "../../../../kit/text.js";

/** Where a bid rule schedule is in its life cycle. */
export type BidRuleScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One bid rule schedule, with what the planners need to act on it. */
export class BidRuleSchedule {
  code: string;
  title: string;
  margin: number;
  contactEmail: string;
  createdAt: number;
  weight: number;
  locale: string;
  unit: string;
  category: string;
  audienceId: string;
  status: BidRuleScheduleStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    contactEmail: string,
    createdAt: number,
    weight: number,
    locale: string,
    unit: string,
    category: string,
    audienceId: string,
    status: BidRuleScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.weight = weight;
    this.locale = locale;
    this.unit = unit;
    this.category = category;
    this.audienceId = audienceId;
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

  canMoveTo(next: BidRuleScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BidRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule schedule"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.margin - this.weight) * 100) / 100;
  }

  copy(): BidRuleSchedule {
    return new BidRuleSchedule(
      this.code,
      this.title,
      this.margin,
      this.contactEmail,
      this.createdAt,
      this.weight,
      this.locale,
      this.unit,
      this.category,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule schedule in status idle. */
export function newBidRuleSchedule(code: string, title: string): BidRuleSchedule {
  return new BidRuleSchedule(code, title, 0, "", 0, 0, "", "", "", "", "idle");
}

import * as text from "../../../../kit/text.js";

/** Where a scheduled enrollment rule is in its life cycle. */
export type ScheduledEnrollmentRuleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled enrollment rule, with what the planners need to act on it. */
export class ScheduledEnrollmentRule {
  code: string;
  title: string;
  margin: number;
  locale: string;
  approved: boolean;
  channel: string;
  bid: number;
  durationMinutes: number;
  cost: number;
  status: ScheduledEnrollmentRuleStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    locale: string,
    approved: boolean,
    channel: string,
    bid: number,
    durationMinutes: number,
    cost: number,
    status: ScheduledEnrollmentRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.locale = locale;
    this.approved = approved;
    this.channel = channel;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledEnrollmentRuleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledEnrollmentRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled enrollment rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round((this.bid + this.margin) * 100) / 100;
  }

  copy(): ScheduledEnrollmentRule {
    return new ScheduledEnrollmentRule(
      this.code,
      this.title,
      this.margin,
      this.locale,
      this.approved,
      this.channel,
      this.bid,
      this.durationMinutes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled enrollment rule in status draft. */
export function newScheduledEnrollmentRule(code: string, title: string): ScheduledEnrollmentRule {
  return new ScheduledEnrollmentRule(code, title, 0, "", false, "", 0, 0, 0, "draft");
}

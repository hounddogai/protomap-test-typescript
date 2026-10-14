import * as text from "../../../../kit/text.js";

/** Where a mention threshold is in its life cycle. */
export type MentionThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One mention threshold, with what the planners need to act on it. */
export class MentionThreshold {
  code: string;
  title: string;
  conversionRate: number;
  cost: number;
  budget: number;
  clicks: number;
  ceiling: number;
  channel: string;
  timezone: string;
  status: MentionThresholdStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    cost: number,
    budget: number,
    clicks: number,
    ceiling: number,
    channel: string,
    timezone: string,
    status: MentionThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.budget = budget;
    this.clicks = clicks;
    this.ceiling = ceiling;
    this.channel = channel;
    this.timezone = timezone;
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

  canMoveTo(next: MentionThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: MentionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget - this.ceiling) * 100) / 100;
  }

  copy(): MentionThreshold {
    return new MentionThreshold(
      this.code,
      this.title,
      this.conversionRate,
      this.cost,
      this.budget,
      this.clicks,
      this.ceiling,
      this.channel,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention threshold in status proposed. */
export function newMentionThreshold(code: string, title: string): MentionThreshold {
  return new MentionThreshold(code, title, 0, 0, 0, 0, 0, "", "", "proposed");
}

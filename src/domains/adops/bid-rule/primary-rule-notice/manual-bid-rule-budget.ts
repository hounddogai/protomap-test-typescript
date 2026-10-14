import * as text from "../../../../kit/text.js";

/** Where a manual bid rule budget is in its life cycle. */
export type ManualBidRuleBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a manual bid rule budget and its current status. */
export class ManualBidRuleBudget {
  code: string;
  title: string;
  channel: string;
  locale: string;
  bid: number;
  startsAt: number;
  retries: number;
  threshold: number;
  campaignRef: string;
  country: string;
  description: string;
  status: ManualBidRuleBudgetStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    locale: string,
    bid: number,
    startsAt: number,
    retries: number,
    threshold: number,
    campaignRef: string,
    country: string,
    description: string,
    status: ManualBidRuleBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.locale = locale;
    this.bid = bid;
    this.startsAt = startsAt;
    this.retries = retries;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.country = country;
    this.description = description;
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

  canMoveTo(next: ManualBidRuleBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualBidRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual bid rule budget"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.retries + this.startsAt) * 100) / 100;
  }

  copy(): ManualBidRuleBudget {
    return new ManualBidRuleBudget(
      this.code,
      this.title,
      this.channel,
      this.locale,
      this.bid,
      this.startsAt,
      this.retries,
      this.threshold,
      this.campaignRef,
      this.country,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual bid rule budget in status proposed. */
export function newManualBidRuleBudget(code: string, title: string): ManualBidRuleBudget {
  return new ManualBidRuleBudget(code, title, "", "", 0, 0, 0, 0, "", "", "", "proposed");
}

/**
 * The legacy ticket view summary records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view summary is in its life cycle. */
export type LegacyTicketViewSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy ticket view summary, with what the planners need to act on it. */
export class LegacyTicketViewSummary {
  code: string;
  title: string;
  weight: number;
  locale: string;
  budget: number;
  conversionRate: number;
  threshold: number;
  endsAt: number;
  impressions: number;
  bid: number;
  priority: number;
  status: LegacyTicketViewSummaryStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    locale: string,
    budget: number,
    conversionRate: number,
    threshold: number,
    endsAt: number,
    impressions: number,
    bid: number,
    priority: number,
    status: LegacyTicketViewSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.locale = locale;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.bid = bid;
    this.priority = priority;
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

  canMoveTo(next: LegacyTicketViewSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyTicketViewSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy ticket view summary"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid - this.impressions) * 100) / 100;
  }

  copy(): LegacyTicketViewSummary {
    return new LegacyTicketViewSummary(
      this.code,
      this.title,
      this.weight,
      this.locale,
      this.budget,
      this.conversionRate,
      this.threshold,
      this.endsAt,
      this.impressions,
      this.bid,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy ticket view summary in status idle. */
export function newLegacyTicketViewSummary(code: string, title: string): LegacyTicketViewSummary {
  return new LegacyTicketViewSummary(code, title, 0, "", 0, 0, 0, 0, 0, 0, 0, "idle");
}

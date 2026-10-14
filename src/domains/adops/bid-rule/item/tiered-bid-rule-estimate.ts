import * as text from "../../../../kit/text.js";

/** Where a tiered bid rule estimate is in its life cycle. */
export type TieredBidRuleEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered bid rule estimate and its current status. */
export class TieredBidRuleEstimate {
  code: string;
  title: string;
  priority: number;
  endsAt: number;
  segment: string;
  discount: number;
  phone: string;
  locale: string;
  source: string;
  cost: number;
  unit: string;
  status: TieredBidRuleEstimateStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    endsAt: number,
    segment: string,
    discount: number,
    phone: string,
    locale: string,
    source: string,
    cost: number,
    unit: string,
    status: TieredBidRuleEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.endsAt = endsAt;
    this.segment = segment;
    this.discount = discount;
    this.phone = phone;
    this.locale = locale;
    this.source = source;
    this.cost = cost;
    this.unit = unit;
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

  canMoveTo(next: TieredBidRuleEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredBidRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bid rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round(this.discount * this.cost * 100) / 100;
  }

  copy(): TieredBidRuleEstimate {
    return new TieredBidRuleEstimate(
      this.code,
      this.title,
      this.priority,
      this.endsAt,
      this.segment,
      this.discount,
      this.phone,
      this.locale,
      this.source,
      this.cost,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered bid rule estimate in status idle. */
export function newTieredBidRuleEstimate(code: string, title: string): TieredBidRuleEstimate {
  return new TieredBidRuleEstimate(code, title, 0, 0, "", 0, "", "", "", 0, "", "idle");
}

import * as text from "../../../../kit/text.js";

/** Where a tiered exit rule metric is in its life cycle. */
export type TieredExitRuleMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tiered exit rule metric, with what the planners need to act on it. */
export class TieredExitRuleMetric {
  code: string;
  title: string;
  amount: number;
  clicks: number;
  retries: number;
  conversionRate: number;
  active: boolean;
  archived: boolean;
  status: TieredExitRuleMetricStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    clicks: number,
    retries: number,
    conversionRate: number,
    active: boolean,
    archived: boolean,
    status: TieredExitRuleMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.clicks = clicks;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.active = active;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredExitRuleMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredExitRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered exit rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered exit rule metric"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.clicks - this.conversionRate) * 100) / 100;
  }

  copy(): TieredExitRuleMetric {
    return new TieredExitRuleMetric(
      this.code,
      this.title,
      this.amount,
      this.clicks,
      this.retries,
      this.conversionRate,
      this.active,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered exit rule metric in status open. */
export function newTieredExitRuleMetric(code: string, title: string): TieredExitRuleMetric {
  return new TieredExitRuleMetric(code, title, 0, 0, 0, 0, false, false, "open");
}

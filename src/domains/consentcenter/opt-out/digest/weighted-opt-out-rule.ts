import * as text from "../../../../kit/text.js";

/** Where a weighted opt out rule is in its life cycle. */
export type WeightedOptOutRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a weighted opt out rule and its current status. */
export class WeightedOptOutRule {
  code: string;
  name: string;
  source: string;
  timezone: string;
  cost: number;
  locale: string;
  sequence: number;
  discount: number;
  status: WeightedOptOutRuleStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    timezone: string,
    cost: number,
    locale: string,
    sequence: number,
    discount: number,
    status: WeightedOptOutRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.timezone = timezone;
    this.cost = cost;
    this.locale = locale;
    this.sequence = sequence;
    this.discount = discount;
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

  canMoveTo(next: WeightedOptOutRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedOptOutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted opt out rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted opt out rule"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.cost + this.sequence) * 100) / 100;
  }

  copy(): WeightedOptOutRule {
    return new WeightedOptOutRule(
      this.code,
      this.name,
      this.source,
      this.timezone,
      this.cost,
      this.locale,
      this.sequence,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted opt out rule in status open. */
export function newWeightedOptOutRule(code: string, name: string): WeightedOptOutRule {
  return new WeightedOptOutRule(code, name, "", "", 0, "", 0, 0, "open");
}

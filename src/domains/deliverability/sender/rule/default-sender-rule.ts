/**
 * The default sender rule records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default sender rule is in its life cycle. */
export type DefaultSenderRuleStatus = "created" | "validated" | "published" | "retired";

/** A default sender rule as the sender team keeps it. */
export class DefaultSenderRule {
  code: string;
  name: string;
  budget: number;
  score: number;
  conversionRate: number;
  threshold: number;
  ratio: number;
  active: boolean;
  visible: boolean;
  timezone: string;
  status: DefaultSenderRuleStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    score: number,
    conversionRate: number,
    threshold: number,
    ratio: number,
    active: boolean,
    visible: boolean,
    timezone: string,
    status: DefaultSenderRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.score = score;
    this.conversionRate = conversionRate;
    this.threshold = threshold;
    this.ratio = ratio;
    this.active = active;
    this.visible = visible;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultSenderRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultSenderRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round((this.budget + this.ratio) * 100) / 100;
  }

  copy(): DefaultSenderRule {
    return new DefaultSenderRule(
      this.code,
      this.name,
      this.budget,
      this.score,
      this.conversionRate,
      this.threshold,
      this.ratio,
      this.active,
      this.visible,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default sender rule in status created. */
export function newDefaultSenderRule(code: string, name: string): DefaultSenderRule {
  return new DefaultSenderRule(code, name, 0, 0, 0, 0, 0, false, false, "", "created");
}

/**
 * The tiered reward rule threshold records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule threshold is in its life cycle. */
export type TieredRewardRuleThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered reward rule threshold. Its code is unique within a tenant. */
export class TieredRewardRuleThreshold {
  code: string;
  label: string;
  tags: string[];
  cost: number;
  currency: string;
  bid: number;
  score: number;
  graceDays: number;
  description: string;
  sendAt: number;
  attributes: Map<string, string>;
  status: TieredRewardRuleThresholdStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    cost: number,
    currency: string,
    bid: number,
    score: number,
    graceDays: number,
    description: string,
    sendAt: number,
    attributes: Map<string, string>,
    status: TieredRewardRuleThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.cost = cost;
    this.currency = currency;
    this.bid = bid;
    this.score = score;
    this.graceDays = graceDays;
    this.description = description;
    this.sendAt = sendAt;
    this.attributes = attributes;
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

  canMoveTo(next: TieredRewardRuleThresholdStatus): boolean {
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

  moveTo(next: TieredRewardRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.sendAt + this.bid) * 100) / 100;
  }

  copy(): TieredRewardRuleThreshold {
    return new TieredRewardRuleThreshold(
      this.code,
      this.label,
      this.tags,
      this.cost,
      this.currency,
      this.bid,
      this.score,
      this.graceDays,
      this.description,
      this.sendAt,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered reward rule threshold in status proposed. */
export function newTieredRewardRuleThreshold(code: string, label: string): TieredRewardRuleThreshold {
  return new TieredRewardRuleThreshold(code, label, [], 0, "", 0, 0, 0, "", 0, new Map<string, string>(), "proposed");
}

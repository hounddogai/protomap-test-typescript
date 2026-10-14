/**
 * The batched reward rule records of loyaltyhub's reward work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched reward rule is in its life cycle. */
export type BatchedRewardRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched reward rule as the reward team keeps it. */
export class BatchedRewardRule {
  code: string;
  label: string;
  rate: number;
  locale: string;
  utmSource: string;
  country: string;
  limit: number;
  archived: boolean;
  retries: number;
  sendAt: number;
  discount: number;
  status: BatchedRewardRuleStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    locale: string,
    utmSource: string,
    country: string,
    limit: number,
    archived: boolean,
    retries: number,
    sendAt: number,
    discount: number,
    status: BatchedRewardRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.locale = locale;
    this.utmSource = utmSource;
    this.country = country;
    this.limit = limit;
    this.archived = archived;
    this.retries = retries;
    this.sendAt = sendAt;
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

  canMoveTo(next: BatchedRewardRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
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

  moveTo(next: BatchedRewardRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.rate * this.discount * 100) / 100;
  }

  copy(): BatchedRewardRule {
    return new BatchedRewardRule(
      this.code,
      this.label,
      this.rate,
      this.locale,
      this.utmSource,
      this.country,
      this.limit,
      this.archived,
      this.retries,
      this.sendAt,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched reward rule in status open. */
export function newBatchedRewardRule(code: string, label: string): BatchedRewardRule {
  return new BatchedRewardRule(code, label, 0, "", "", "", 0, false, 0, 0, 0, "open");
}

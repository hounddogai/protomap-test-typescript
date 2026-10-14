/**
 * The fallback mention rule records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback mention rule is in its life cycle. */
export type FallbackMentionRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback mention rule as the mention team keeps it. */
export class FallbackMentionRule {
  code: string;
  title: string;
  retries: number;
  locale: string;
  pinned: boolean;
  channel: string;
  revision: number;
  score: number;
  conversionRate: number;
  status: FallbackMentionRuleStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    locale: string,
    pinned: boolean,
    channel: string,
    revision: number,
    score: number,
    conversionRate: number,
    status: FallbackMentionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.locale = locale;
    this.pinned = pinned;
    this.channel = channel;
    this.revision = revision;
    this.score = score;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: FallbackMentionRuleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackMentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback mention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.revision + this.conversionRate) * 100) / 100;
  }

  copy(): FallbackMentionRule {
    return new FallbackMentionRule(
      this.code,
      this.title,
      this.retries,
      this.locale,
      this.pinned,
      this.channel,
      this.revision,
      this.score,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback mention rule in status open. */
export function newFallbackMentionRule(code: string, title: string): FallbackMentionRule {
  return new FallbackMentionRule(code, title, 0, "", false, "", 0, 0, 0, "open");
}

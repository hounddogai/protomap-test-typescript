/**
 * The legacy mention rule records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy mention rule is in its life cycle. */
export type LegacyMentionRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One legacy mention rule, with what the planners need to act on it. */
export class LegacyMentionRule {
  code: string;
  title: string;
  ratio: number;
  batchSize: number;
  retries: number;
  attempts: number;
  score: number;
  archived: boolean;
  status: LegacyMentionRuleStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    batchSize: number,
    retries: number,
    attempts: number,
    score: number,
    archived: boolean,
    status: LegacyMentionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.batchSize = batchSize;
    this.retries = retries;
    this.attempts = attempts;
    this.score = score;
    this.archived = archived;
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

  canMoveTo(next: LegacyMentionRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyMentionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy mention rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round(this.attempts * this.batchSize * 100) / 100;
  }

  copy(): LegacyMentionRule {
    return new LegacyMentionRule(
      this.code,
      this.title,
      this.ratio,
      this.batchSize,
      this.retries,
      this.attempts,
      this.score,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy mention rule in status idle. */
export function newLegacyMentionRule(code: string, title: string): LegacyMentionRule {
  return new LegacyMentionRule(code, title, 0, 0, 0, 0, 0, false, "idle");
}

/**
 * The global exit rule notice records of journeys's exit rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global exit rule notice is in its life cycle. */
export type GlobalExitRuleNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global exit rule notice, with what the planners need to act on it. */
export class GlobalExitRuleNotice {
  code: string;
  title: string;
  updatedAt: number;
  amount: number;
  budget: number;
  revision: number;
  country: string;
  status: GlobalExitRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    amount: number,
    budget: number,
    revision: number,
    country: string,
    status: GlobalExitRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.budget = budget;
    this.revision = revision;
    this.country = country;
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

  canMoveTo(next: GlobalExitRuleNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalExitRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global exit rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.amount + this.budget) * 100) / 100;
  }

  copy(): GlobalExitRuleNotice {
    return new GlobalExitRuleNotice(
      this.code,
      this.title,
      this.updatedAt,
      this.amount,
      this.budget,
      this.revision,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global exit rule notice in status open. */
export function newGlobalExitRuleNotice(code: string, title: string): GlobalExitRuleNotice {
  return new GlobalExitRuleNotice(code, title, 0, 0, 0, 0, "", "open");
}

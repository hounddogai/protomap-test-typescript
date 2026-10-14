/**
 * The fallback bid rule window records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule window is in its life cycle. */
export type FallbackBidRuleWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback bid rule window as the bid rule team keeps it. */
export class FallbackBidRuleWindow {
  code: string;
  label: string;
  windowDays: number;
  expiresAt: number;
  audienceId: string;
  status: FallbackBidRuleWindowStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    expiresAt: number,
    audienceId: string,
    status: FallbackBidRuleWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: FallbackBidRuleWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackBidRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.windowDays) * 100) / 100;
  }

  copy(): FallbackBidRuleWindow {
    return new FallbackBidRuleWindow(
      this.code,
      this.label,
      this.windowDays,
      this.expiresAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback bid rule window in status open. */
export function newFallbackBidRuleWindow(code: string, label: string): FallbackBidRuleWindow {
  return new FallbackBidRuleWindow(code, label, 0, 0, "", "open");
}

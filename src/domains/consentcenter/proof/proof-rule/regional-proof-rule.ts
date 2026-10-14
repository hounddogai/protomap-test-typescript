/**
 * The regional proof rule records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional proof rule is in its life cycle. */
export type RegionalProofRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional proof rule, with what the planners need to act on it. */
export class RegionalProofRule {
  code: string;
  label: string;
  category: string;
  attempts: number;
  active: boolean;
  locale: string;
  impressions: number;
  status: RegionalProofRuleStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    attempts: number,
    active: boolean,
    locale: string,
    impressions: number,
    status: RegionalProofRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.attempts = attempts;
    this.active = active;
    this.locale = locale;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalProofRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round(this.impressions * this.attempts * 100) / 100;
  }

  copy(): RegionalProofRule {
    return new RegionalProofRule(
      this.code,
      this.label,
      this.category,
      this.attempts,
      this.active,
      this.locale,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional proof rule in status planned. */
export function newRegionalProofRule(code: string, label: string): RegionalProofRule {
  return new RegionalProofRule(code, label, "", 0, false, "", 0, "planned");
}

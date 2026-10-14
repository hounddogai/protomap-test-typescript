/**
 * The escalation rule records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation rule is in its life cycle. */
export type EscalationRuleStatus = "created" | "validated" | "published" | "retired";

/** The record of a escalation rule and its current status. */
export class EscalationRule {
  code: string;
  label: string;
  score: number;
  phone: string;
  conversionRate: number;
  status: EscalationRuleStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    phone: string,
    conversionRate: number,
    status: EscalationRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.phone = phone;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: EscalationRuleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EscalationRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate + this.score) * 100) / 100;
  }

  copy(): EscalationRule {
    return new EscalationRule(this.code, this.label, this.score, this.phone, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation rule in status created. */
export function newEscalationRule(code: string, label: string): EscalationRule {
  return new EscalationRule(code, label, 0, "", 0, "created");
}

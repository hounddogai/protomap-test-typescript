import * as text from "../../../../kit/text.js";

/** Where a manual tier rule is in its life cycle. */
export type ManualTierRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual tier rule and its current status. */
export class ManualTierRule {
  code: string;
  label: string;
  externalRef: string;
  frequencyCap: number;
  notes: string;
  currency: string;
  status: ManualTierRuleStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    frequencyCap: number,
    notes: string,
    currency: string,
    status: ManualTierRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.currency = currency;
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

  canMoveTo(next: ManualTierRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualTierRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): ManualTierRule {
    return new ManualTierRule(
      this.code,
      this.label,
      this.externalRef,
      this.frequencyCap,
      this.notes,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual tier rule in status planned. */
export function newManualTierRule(code: string, label: string): ManualTierRule {
  return new ManualTierRule(code, label, "", 0, "", "", "planned");
}

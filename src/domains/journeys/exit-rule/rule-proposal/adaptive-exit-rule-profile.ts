import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule profile is in its life cycle. */
export type AdaptiveExitRuleProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive exit rule profile. Its code is unique within a tenant. */
export class AdaptiveExitRuleProfile {
  code: string;
  label: string;
  impressions: number;
  frequencyCap: number;
  bid: number;
  externalRef: string;
  cohort: string;
  visible: boolean;
  amount: number;
  status: AdaptiveExitRuleProfileStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    frequencyCap: number,
    bid: number,
    externalRef: string,
    cohort: string,
    visible: boolean,
    amount: number,
    status: AdaptiveExitRuleProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.visible = visible;
    this.amount = amount;
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

  canMoveTo(next: AdaptiveExitRuleProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: AdaptiveExitRuleProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.amount - this.impressions) * 100) / 100;
  }

  copy(): AdaptiveExitRuleProfile {
    return new AdaptiveExitRuleProfile(
      this.code,
      this.label,
      this.impressions,
      this.frequencyCap,
      this.bid,
      this.externalRef,
      this.cohort,
      this.visible,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive exit rule profile in status open. */
export function newAdaptiveExitRuleProfile(code: string, label: string): AdaptiveExitRuleProfile {
  return new AdaptiveExitRuleProfile(code, label, 0, 0, 0, "", "", false, 0, "open");
}

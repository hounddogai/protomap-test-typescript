/**
 * The manual deflection rule records of support's deflection work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual deflection rule is in its life cycle. */
export type ManualDeflectionRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a manual deflection rule and its current status. */
export class ManualDeflectionRule {
  code: string;
  title: string;
  contactEmail: string;
  threshold: number;
  cohort: string;
  utmSource: string;
  maximum: number;
  status: ManualDeflectionRuleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    threshold: number,
    cohort: string,
    utmSource: string,
    maximum: number,
    status: ManualDeflectionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualDeflectionRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualDeflectionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual deflection rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedLoad(): number {
    return Math.round((this.threshold - this.maximum) * 100) / 100;
  }

  copy(): ManualDeflectionRule {
    return new ManualDeflectionRule(
      this.code,
      this.title,
      this.contactEmail,
      this.threshold,
      this.cohort,
      this.utmSource,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a manual deflection rule in status new. */
export function newManualDeflectionRule(code: string, title: string): ManualDeflectionRule {
  return new ManualDeflectionRule(code, title, "", 0, "", "", 0, "new");
}

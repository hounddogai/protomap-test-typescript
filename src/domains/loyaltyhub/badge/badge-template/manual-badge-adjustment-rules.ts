import * as text from "../../../../kit/text.js";
import { ManualBadgeAdjustment } from "./manual-badge-adjustment.js";

/** A rule a manual badge adjustment must pass. Check returns its problems, or none. */
export interface ManualBadgeAdjustmentRule {
  check(item: ManualBadgeAdjustment): string[];
}

export class ManualBadgeAdjustmentRequiredCohortRule implements ManualBadgeAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBadgeAdjustment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBadgeAdjustmentRequiredTitleRule implements ManualBadgeAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBadgeAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBadgeAdjustmentAllowedCohortRule implements ManualBadgeAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualBadgeAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is blocked`];
    return [];
  }
}

/** Runs every rule of a manual badge adjustment. */
export class ManualBadgeAdjustmentValidator {
  rules: ManualBadgeAdjustmentRule[];

  constructor(rules: ManualBadgeAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBadgeAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ManualBadgeAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBadgeAdjustment[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultManualBadgeAdjustmentValidator(): ManualBadgeAdjustmentValidator {
  return new ManualBadgeAdjustmentValidator(
    [
      new ManualBadgeAdjustmentRequiredCohortRule("manual badge adjustment needs a value"),
      new ManualBadgeAdjustmentRequiredTitleRule("manual badge adjustment needs an entry"),
      new ManualBadgeAdjustmentAllowedCohortRule(["adaptive", "default"]),
    ],
  );
}

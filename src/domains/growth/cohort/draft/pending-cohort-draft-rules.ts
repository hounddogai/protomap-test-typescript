import * as text from "../../../../kit/text.js";
import { PendingCohortDraft } from "./pending-cohort-draft.js";

/** A rule a pending cohort draft must pass. Check returns its problems, or none. */
export interface PendingCohortDraftRule {
  check(item: PendingCohortDraft): string[];
}

export class PendingCohortDraftRequiredLabelRule implements PendingCohortDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCohortDraftCapacityRangeRule implements PendingCohortDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortDraft): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCohortDraftAllowedVariantRule implements PendingCohortDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCohortDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is expired`];
    return [];
  }
}

/** Runs every rule of a pending cohort draft. */
export class PendingCohortDraftValidator {
  rules: PendingCohortDraftRule[];

  constructor(rules: PendingCohortDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCohortDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortDraft[]): Map<string, string[]> {
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

export function defaultPendingCohortDraftValidator(): PendingCohortDraftValidator {
  return new PendingCohortDraftValidator(
    [
      new PendingCohortDraftRequiredLabelRule("pending cohort draft needs a value"),
      new PendingCohortDraftCapacityRangeRule(80, 255),
      new PendingCohortDraftAllowedVariantRule([]),
    ],
  );
}

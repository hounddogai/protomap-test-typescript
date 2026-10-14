import { RollingCohortDraft } from "./rolling-cohort-draft.js";

/** A rule a rolling cohort draft must pass. Check returns its problems, or none. */
export interface RollingCohortDraftRule {
  check(item: RollingCohortDraft): string[];
}

export class RollingCohortDraftThresholdRangeRule implements RollingCohortDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortDraft): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingCohortDraftRequiredCodeRule implements RollingCohortDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortDraftRequiredNameRule implements RollingCohortDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortDraftRequiredLocaleRule implements RollingCohortDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCohortDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCohortDraftBudgetRangeRule implements RollingCohortDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCohortDraft): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling cohort draft. */
export class RollingCohortDraftValidator {
  rules: RollingCohortDraftRule[];

  constructor(rules: RollingCohortDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCohortDraft): string[] {
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

  requireValid(item: RollingCohortDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCohortDraft[]): Map<string, string[]> {
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

export function defaultRollingCohortDraftValidator(): RollingCohortDraftValidator {
  return new RollingCohortDraftValidator(
    [
      new RollingCohortDraftThresholdRangeRule(3.7, 3619.3),
      new RollingCohortDraftRequiredCodeRule("rolling cohort draft needs this field"),
      new RollingCohortDraftRequiredNameRule("rolling cohort draft needs an entry"),
      new RollingCohortDraftRequiredLocaleRule("rolling cohort draft needs this field"),
      new RollingCohortDraftBudgetRangeRule(8.9, 4995.2),
    ],
  );
}

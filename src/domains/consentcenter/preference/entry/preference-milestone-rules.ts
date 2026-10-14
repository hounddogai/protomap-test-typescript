import { PreferenceMilestone } from "./preference-milestone.js";

/** A rule a preference milestone must pass. Check returns its problems, or none. */
export interface PreferenceMilestoneRule {
  check(item: PreferenceMilestone): string[];
}

export class PreferenceMilestoneRequiredLabelRule implements PreferenceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceMilestoneRatioRangeRule implements PreferenceMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceMilestone): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceMilestoneRequiredNameRule implements PreferenceMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceMilestoneExternalRefLengthRule implements PreferenceMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceMilestone): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceMilestoneRetriesRangeRule implements PreferenceMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceMilestone): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference milestone. */
export class PreferenceMilestoneValidator {
  rules: PreferenceMilestoneRule[];

  constructor(rules: PreferenceMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceMilestone[]): Map<string, string[]> {
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

export function defaultPreferenceMilestoneValidator(): PreferenceMilestoneValidator {
  return new PreferenceMilestoneValidator(
    [
      new PreferenceMilestoneRequiredLabelRule("preference milestone needs this field"),
      new PreferenceMilestoneRatioRangeRule(8.7, 1338.7),
      new PreferenceMilestoneRequiredNameRule("preference milestone needs this field"),
      new PreferenceMilestoneExternalRefLengthRule(255),
      new PreferenceMilestoneRetriesRangeRule(120, 86400),
    ],
  );
}

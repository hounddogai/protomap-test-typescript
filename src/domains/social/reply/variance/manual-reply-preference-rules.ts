import { ManualReplyPreference } from "./manual-reply-preference.js";

/** A rule a manual reply preference must pass. Check returns its problems, or none. */
export interface ManualReplyPreferenceRule {
  check(item: ManualReplyPreference): string[];
}

export class ManualReplyPreferenceCapacityRangeRule implements ManualReplyPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyPreference): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualReplyPreferenceClicksRangeRule implements ManualReplyPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReplyPreference): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualReplyPreferenceRequiredExternalRefRule implements ManualReplyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReplyPreference): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual reply preference. */
export class ManualReplyPreferenceValidator {
  rules: ManualReplyPreferenceRule[];

  constructor(rules: ManualReplyPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReplyPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualReplyPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReplyPreference[]): Map<string, string[]> {
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

export function defaultManualReplyPreferenceValidator(): ManualReplyPreferenceValidator {
  return new ManualReplyPreferenceValidator(
    [
      new ManualReplyPreferenceCapacityRangeRule(16, 255),
      new ManualReplyPreferenceClicksRangeRule(16, 120),
      new ManualReplyPreferenceRequiredExternalRefRule("manual reply preference needs a value"),
    ],
  );
}

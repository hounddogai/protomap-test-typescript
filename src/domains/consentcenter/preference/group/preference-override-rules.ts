import { PreferenceOverride } from "./preference-override.js";

/** A rule a preference override must pass. Check returns its problems, or none. */
export interface PreferenceOverrideRule {
  check(item: PreferenceOverride): string[];
}

export class PreferenceOverrideRequiredLabelRule implements PreferenceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceOverrideRequiredCodeRule implements PreferenceOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceOverrideReviewerLengthRule implements PreferenceOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceOverride): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceOverrideSendAtRangeRule implements PreferenceOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceOverride): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a preference override. */
export class PreferenceOverrideValidator {
  rules: PreferenceOverrideRule[];

  constructor(rules: PreferenceOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceOverride): string[] {
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

  requireValid(item: PreferenceOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceOverride[]): Map<string, string[]> {
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

export function defaultPreferenceOverrideValidator(): PreferenceOverrideValidator {
  return new PreferenceOverrideValidator(
    [
      new PreferenceOverrideRequiredLabelRule("preference override needs this field"),
      new PreferenceOverrideRequiredCodeRule("preference override needs an entry"),
      new PreferenceOverrideReviewerLengthRule(32),
      new PreferenceOverrideSendAtRangeRule(64, 80),
    ],
  );
}

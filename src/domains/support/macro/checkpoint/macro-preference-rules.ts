import { MacroPreference } from "./macro-preference.js";

/** A rule a macro preference must pass. Check returns its problems, or none. */
export interface MacroPreferenceRule {
  check(item: MacroPreference): string[];
}

export class MacroPreferenceLabelLengthRule implements MacroPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroPreferenceMinimumRangeRule implements MacroPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroPreference): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroPreferenceVisibleGuardRule implements MacroPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MacroPreference): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class MacroPreferenceRequiredCodeRule implements MacroPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroPreferenceCodePrefixRule implements MacroPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro preference. */
export class MacroPreferenceValidator {
  rules: MacroPreferenceRule[];

  constructor(rules: MacroPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: MacroPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroPreference[]): Map<string, string[]> {
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

export function defaultMacroPreferenceValidator(): MacroPreferenceValidator {
  return new MacroPreferenceValidator(
    [
      new MacroPreferenceLabelLengthRule(120),
      new MacroPreferenceMinimumRangeRule(4.9, 4633.9),
      new MacroPreferenceVisibleGuardRule(7.4),
      new MacroPreferenceRequiredCodeRule("macro preference needs this field"),
      new MacroPreferenceCodePrefixRule("Q"),
    ],
  );
}

import { RegionalQueuePreference } from "./regional-queue-preference.js";

/** A rule a regional queue preference must pass. Check returns its problems, or none. */
export interface RegionalQueuePreferenceRule {
  check(item: RegionalQueuePreference): string[];
}

export class RegionalQueuePreferenceRequiredNameRule implements RegionalQueuePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueuePreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueuePreferenceCodePrefixRule implements RegionalQueuePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalQueuePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalQueuePreferenceCodeLengthRule implements RegionalQueuePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalQueuePreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalQueuePreferenceRequiredCodeRule implements RegionalQueuePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueuePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueuePreferenceCeilingRangeRule implements RegionalQueuePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalQueuePreference): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional queue preference. */
export class RegionalQueuePreferenceValidator {
  rules: RegionalQueuePreferenceRule[];

  constructor(rules: RegionalQueuePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalQueuePreference): string[] {
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

  requireValid(item: RegionalQueuePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalQueuePreference[]): Map<string, string[]> {
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

export function defaultRegionalQueuePreferenceValidator(): RegionalQueuePreferenceValidator {
  return new RegionalQueuePreferenceValidator(
    [
      new RegionalQueuePreferenceRequiredNameRule("regional queue preference needs this field"),
      new RegionalQueuePreferenceCodePrefixRule("ACM"),
      new RegionalQueuePreferenceCodeLengthRule(64),
      new RegionalQueuePreferenceRequiredCodeRule("regional queue preference needs this field"),
      new RegionalQueuePreferenceCeilingRangeRule(3.7, 801.5),
    ],
  );
}

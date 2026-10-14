import { FunnelPreference } from "./funnel-preference.js";

/** A rule a funnel preference must pass. Check returns its problems, or none. */
export interface FunnelPreferenceRule {
  check(item: FunnelPreference): string[];
}

export class FunnelPreferenceRequiredCodeRule implements FunnelPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelPreferenceCodeLengthRule implements FunnelPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPreferenceCodePrefixRule implements FunnelPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelPreferenceCostRangeRule implements FunnelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelPreference): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelPreferenceRateRangeRule implements FunnelPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelPreference): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a funnel preference. */
export class FunnelPreferenceValidator {
  rules: FunnelPreferenceRule[];

  constructor(rules: FunnelPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelPreference): string[] {
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

  requireValid(item: FunnelPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelPreference[]): Map<string, string[]> {
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

export function defaultFunnelPreferenceValidator(): FunnelPreferenceValidator {
  return new FunnelPreferenceValidator(
    [
      new FunnelPreferenceRequiredCodeRule("funnel preference needs an entry"),
      new FunnelPreferenceCodeLengthRule(3600),
      new FunnelPreferenceCodePrefixRule("REF"),
      new FunnelPreferenceCostRangeRule(3.7, 4973.5),
      new FunnelPreferenceRateRangeRule(9.8, 3567.1),
    ],
  );
}

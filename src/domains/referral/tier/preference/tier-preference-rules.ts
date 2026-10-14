import { TierPreference } from "./tier-preference.js";

/** A rule a tier preference must pass. Check returns its problems, or none. */
export interface TierPreferenceRule {
  check(item: TierPreference): string[];
}

export class TierPreferenceApprovedGuardRule implements TierPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TierPreference): string[] {
    if (item.approved && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TierPreferenceRequiredNameRule implements TierPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierPreferenceBatchSizeRangeRule implements TierPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierPreference): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TierPreferenceRequiredCodeRule implements TierPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierPreferenceNameLengthRule implements TierPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier preference. */
export class TierPreferenceValidator {
  rules: TierPreferenceRule[];

  constructor(rules: TierPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TierPreference): string[] {
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

  requireValid(item: TierPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierPreference[]): Map<string, string[]> {
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

export function defaultTierPreferenceValidator(): TierPreferenceValidator {
  return new TierPreferenceValidator(
    [
      new TierPreferenceApprovedGuardRule(255),
      new TierPreferenceRequiredNameRule("tier preference needs an entry"),
      new TierPreferenceBatchSizeRangeRule(255, 3600),
      new TierPreferenceRequiredCodeRule("tier preference needs this field"),
      new TierPreferenceNameLengthRule(120),
    ],
  );
}

import { LegacyPreferencePolicy } from "./legacy-preference-policy.js";

/** A rule a legacy preference policy must pass. Check returns its problems, or none. */
export interface LegacyPreferencePolicyRule {
  check(item: LegacyPreferencePolicy): string[];
}

export class LegacyPreferencePolicyCodeLengthRule implements LegacyPreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPreferencePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPreferencePolicyMinimumRangeRule implements LegacyPreferencePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPreferencePolicy): string[] {
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

export class LegacyPreferencePolicyOwnerIdLengthRule implements LegacyPreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPreferencePolicy): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPreferencePolicyPinnedGuardRule implements LegacyPreferencePolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyPreferencePolicy): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyPreferencePolicyVersionRangeRule implements LegacyPreferencePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPreferencePolicy): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy preference policy. */
export class LegacyPreferencePolicyValidator {
  rules: LegacyPreferencePolicyRule[];

  constructor(rules: LegacyPreferencePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPreferencePolicy): string[] {
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

  requireValid(item: LegacyPreferencePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPreferencePolicy[]): Map<string, string[]> {
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

export function defaultLegacyPreferencePolicyValidator(): LegacyPreferencePolicyValidator {
  return new LegacyPreferencePolicyValidator(
    [
      new LegacyPreferencePolicyCodeLengthRule(64),
      new LegacyPreferencePolicyMinimumRangeRule(6.5, 4527.8),
      new LegacyPreferencePolicyOwnerIdLengthRule(32),
      new LegacyPreferencePolicyPinnedGuardRule(120),
      new LegacyPreferencePolicyVersionRangeRule(80, 120),
    ],
  );
}

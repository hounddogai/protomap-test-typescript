import { SeasonalTierPolicy } from "./seasonal-tier-policy.js";

/** A rule a seasonal tier policy must pass. Check returns its problems, or none. */
export interface SeasonalTierPolicyRule {
  check(item: SeasonalTierPolicy): string[];
}

export class SeasonalTierPolicyPinnedGuardRule implements SeasonalTierPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalTierPolicy): string[] {
    if (item.pinned && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SeasonalTierPolicyRequiredCodeRule implements SeasonalTierPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTierPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalTierPolicyCodePrefixRule implements SeasonalTierPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTierPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTierPolicyDescriptionLengthRule implements SeasonalTierPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTierPolicy): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTierPolicyThresholdRangeRule implements SeasonalTierPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalTierPolicy): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal tier policy. */
export class SeasonalTierPolicyValidator {
  rules: SeasonalTierPolicyRule[];

  constructor(rules: SeasonalTierPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTierPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTierPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTierPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalTierPolicyValidator(): SeasonalTierPolicyValidator {
  return new SeasonalTierPolicyValidator(
    [
      new SeasonalTierPolicyPinnedGuardRule(8.5),
      new SeasonalTierPolicyRequiredCodeRule("seasonal tier policy needs an entry"),
      new SeasonalTierPolicyCodePrefixRule("REF"),
      new SeasonalTierPolicyDescriptionLengthRule(80),
      new SeasonalTierPolicyThresholdRangeRule(0.4, 3944.4),
    ],
  );
}

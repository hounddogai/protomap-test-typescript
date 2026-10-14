import { LegacyLevelTier } from "./legacy-level-tier.js";

/** A rule a legacy level tier must pass. Check returns its problems, or none. */
export interface LegacyLevelTierRule {
  check(item: LegacyLevelTier): string[];
}

export class LegacyLevelTierRequiredSummaryRule implements LegacyLevelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLevelTier): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyLevelTierRequiredCodeRule implements LegacyLevelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLevelTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyLevelTierDescriptionLengthRule implements LegacyLevelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLevelTier): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy level tier. */
export class LegacyLevelTierValidator {
  rules: LegacyLevelTierRule[];

  constructor(rules: LegacyLevelTierRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyLevelTier): string[] {
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

  requireValid(item: LegacyLevelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyLevelTier[]): Map<string, string[]> {
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

export function defaultLegacyLevelTierValidator(): LegacyLevelTierValidator {
  return new LegacyLevelTierValidator(
    [
      new LegacyLevelTierRequiredSummaryRule("legacy level tier needs an entry"),
      new LegacyLevelTierRequiredCodeRule("legacy level tier needs an entry"),
      new LegacyLevelTierDescriptionLengthRule(3600),
    ],
  );
}

import { LevelTier } from "./level-tier.js";

/** A rule a level tier must pass. Check returns its problems, or none. */
export interface LevelTierRule {
  check(item: LevelTier): string[];
}

export class LevelTierRequiredNameRule implements LevelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LevelTierCodeLengthRule implements LevelTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelTierCodePrefixRule implements LevelTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a level tier. */
export class LevelTierValidator {
  rules: LevelTierRule[];

  constructor(rules: LevelTierRule[]) {
    this.rules = rules;
  }

  validate(item: LevelTier): string[] {
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

  requireValid(item: LevelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelTier[]): Map<string, string[]> {
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

export function defaultLevelTierValidator(): LevelTierValidator {
  return new LevelTierValidator(
    [
      new LevelTierRequiredNameRule("level tier needs this field"),
      new LevelTierCodeLengthRule(64),
      new LevelTierCodePrefixRule("Q"),
    ],
  );
}

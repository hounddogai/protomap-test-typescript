import { DefaultLeaderboardMapping } from "./default-leaderboard-mapping.js";

/** A rule a default leaderboard mapping must pass. Check returns its problems, or none. */
export interface DefaultLeaderboardMappingRule {
  check(item: DefaultLeaderboardMapping): string[];
}

export class DefaultLeaderboardMappingThresholdRangeRule implements DefaultLeaderboardMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultLeaderboardMapping): string[] {
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

export class DefaultLeaderboardMappingNameLengthRule implements DefaultLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultLeaderboardMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultLeaderboardMappingRequiredNameRule implements DefaultLeaderboardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultLeaderboardMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultLeaderboardMappingSummaryLengthRule implements DefaultLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultLeaderboardMapping): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultLeaderboardMappingCodePrefixRule implements DefaultLeaderboardMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultLeaderboardMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default leaderboard mapping. */
export class DefaultLeaderboardMappingValidator {
  rules: DefaultLeaderboardMappingRule[];

  constructor(rules: DefaultLeaderboardMappingRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultLeaderboardMapping): string[] {
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

  requireValid(item: DefaultLeaderboardMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultLeaderboardMapping[]): Map<string, string[]> {
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

export function defaultDefaultLeaderboardMappingValidator(): DefaultLeaderboardMappingValidator {
  return new DefaultLeaderboardMappingValidator(
    [
      new DefaultLeaderboardMappingThresholdRangeRule(4.5, 1680.1),
      new DefaultLeaderboardMappingNameLengthRule(3600),
      new DefaultLeaderboardMappingRequiredNameRule("default leaderboard mapping needs a value"),
      new DefaultLeaderboardMappingSummaryLengthRule(255),
      new DefaultLeaderboardMappingCodePrefixRule("X"),
    ],
  );
}

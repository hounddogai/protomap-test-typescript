import { SeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

/** A rule a seasonal badge baseline must pass. Check returns its problems, or none. */
export interface SeasonalBadgeBaselineRule {
  check(item: SeasonalBadgeBaseline): string[];
}

export class SeasonalBadgeBaselineEndsAtRangeRule implements SeasonalBadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBadgeBaseline): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBadgeBaselineCodePrefixRule implements SeasonalBadgeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalBadgeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalBadgeBaselineRequiredCodeRule implements SeasonalBadgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBadgeBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBadgeBaselineCodeLengthRule implements SeasonalBadgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBadgeBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal badge baseline. */
export class SeasonalBadgeBaselineValidator {
  rules: SeasonalBadgeBaselineRule[];

  constructor(rules: SeasonalBadgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBadgeBaseline): string[] {
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

  requireValid(item: SeasonalBadgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBadgeBaseline[]): Map<string, string[]> {
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

export function defaultSeasonalBadgeBaselineValidator(): SeasonalBadgeBaselineValidator {
  return new SeasonalBadgeBaselineValidator(
    [
      new SeasonalBadgeBaselineEndsAtRangeRule(32, 255),
      new SeasonalBadgeBaselineCodePrefixRule("REF"),
      new SeasonalBadgeBaselineRequiredCodeRule("seasonal badge baseline needs a value"),
      new SeasonalBadgeBaselineCodeLengthRule(16),
    ],
  );
}

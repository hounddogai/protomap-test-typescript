import * as text from "../../../../kit/text.js";
import { SeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

/** A rule a seasonal cohort rollup must pass. Check returns its problems, or none. */
export interface SeasonalCohortRollupRule {
  check(item: SeasonalCohortRollup): string[];
}

export class SeasonalCohortRollupNameLengthRule implements SeasonalCohortRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCohortRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalCohortRollupRequiredCodeRule implements SeasonalCohortRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalCohortRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalCohortRollupCodePrefixRule implements SeasonalCohortRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalCohortRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalCohortRollupAllowedReviewerRule implements SeasonalCohortRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalCohortRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is too long`];
    return [];
  }
}

export class SeasonalCohortRollupCodeLengthRule implements SeasonalCohortRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalCohortRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal cohort rollup. */
export class SeasonalCohortRollupValidator {
  rules: SeasonalCohortRollupRule[];

  constructor(rules: SeasonalCohortRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalCohortRollup): string[] {
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

  requireValid(item: SeasonalCohortRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalCohortRollup[]): Map<string, string[]> {
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

export function defaultSeasonalCohortRollupValidator(): SeasonalCohortRollupValidator {
  return new SeasonalCohortRollupValidator(
    [
      new SeasonalCohortRollupNameLengthRule(255),
      new SeasonalCohortRollupRequiredCodeRule("seasonal cohort rollup needs this field"),
      new SeasonalCohortRollupCodePrefixRule("ACM"),
      new SeasonalCohortRollupAllowedReviewerRule(["manual", "lenient"]),
      new SeasonalCohortRollupCodeLengthRule(1000),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { SeasonalReputationVariance } from "./seasonal-reputation-variance.js";

/** A rule a seasonal reputation variance must pass. Check returns its problems, or none. */
export interface SeasonalReputationVarianceRule {
  check(item: SeasonalReputationVariance): string[];
}

export class SeasonalReputationVarianceCodeLengthRule implements SeasonalReputationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationVarianceCodePrefixRule implements SeasonalReputationVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalReputationVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalReputationVarianceAllowedChecksumRule implements SeasonalReputationVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalReputationVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is expired`];
    return [];
  }
}

export class SeasonalReputationVarianceRequiredTitleRule implements SeasonalReputationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationVarianceRequiredSummaryRule implements SeasonalReputationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationVariance): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reputation variance. */
export class SeasonalReputationVarianceValidator {
  rules: SeasonalReputationVarianceRule[];

  constructor(rules: SeasonalReputationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReputationVariance): string[] {
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

  requireValid(item: SeasonalReputationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReputationVariance[]): Map<string, string[]> {
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

export function defaultSeasonalReputationVarianceValidator(): SeasonalReputationVarianceValidator {
  return new SeasonalReputationVarianceValidator(
    [
      new SeasonalReputationVarianceCodeLengthRule(3600),
      new SeasonalReputationVarianceCodePrefixRule("X"),
      new SeasonalReputationVarianceAllowedChecksumRule(["adaptive", "batched", "scheduled"]),
      new SeasonalReputationVarianceRequiredTitleRule("seasonal reputation variance needs an entry"),
      new SeasonalReputationVarianceRequiredSummaryRule("seasonal reputation variance needs this field"),
    ],
  );
}

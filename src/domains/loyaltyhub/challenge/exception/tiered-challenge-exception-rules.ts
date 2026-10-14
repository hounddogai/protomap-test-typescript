import { TieredChallengeException } from "./tiered-challenge-exception.js";

/** A rule a tiered challenge exception must pass. Check returns its problems, or none. */
export interface TieredChallengeExceptionRule {
  check(item: TieredChallengeException): string[];
}

export class TieredChallengeExceptionTitleLengthRule implements TieredChallengeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredChallengeException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredChallengeExceptionCodePrefixRule implements TieredChallengeExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredChallengeException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredChallengeExceptionRequiredCampaignRefRule implements TieredChallengeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredChallengeException): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered challenge exception. */
export class TieredChallengeExceptionValidator {
  rules: TieredChallengeExceptionRule[];

  constructor(rules: TieredChallengeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TieredChallengeException): string[] {
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

  requireValid(item: TieredChallengeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredChallengeException[]): Map<string, string[]> {
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

export function defaultTieredChallengeExceptionValidator(): TieredChallengeExceptionValidator {
  return new TieredChallengeExceptionValidator(
    [
      new TieredChallengeExceptionTitleLengthRule(64),
      new TieredChallengeExceptionCodePrefixRule("REF"),
      new TieredChallengeExceptionRequiredCampaignRefRule("tiered challenge exception needs this field"),
    ],
  );
}

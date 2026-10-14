import * as text from "../../../../kit/text.js";
import { ChallengeQuota } from "./challenge-quota.js";

/** A rule a challenge quota must pass. Check returns its problems, or none. */
export interface ChallengeQuotaRule {
  check(item: ChallengeQuota): string[];
}

export class ChallengeQuotaSequenceRangeRule implements ChallengeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeQuota): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeQuotaCodePrefixRule implements ChallengeQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeQuotaAllowedCodeRule implements ChallengeQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ChallengeQuotaRequiredCodeRule implements ChallengeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeQuotaRequiredCohortRule implements ChallengeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeQuota): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge quota. */
export class ChallengeQuotaValidator {
  rules: ChallengeQuotaRule[];

  constructor(rules: ChallengeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeQuota): string[] {
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

  requireValid(item: ChallengeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeQuota[]): Map<string, string[]> {
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

export function defaultChallengeQuotaValidator(): ChallengeQuotaValidator {
  return new ChallengeQuotaValidator(
    [
      new ChallengeQuotaSequenceRangeRule(16, 80),
      new ChallengeQuotaCodePrefixRule("REF"),
      new ChallengeQuotaAllowedCodeRule(["legacy", "global"]),
      new ChallengeQuotaRequiredCodeRule("challenge quota needs this field"),
      new ChallengeQuotaRequiredCohortRule("challenge quota needs a value"),
    ],
  );
}

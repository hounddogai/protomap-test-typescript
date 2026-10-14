import { PendingExitRuleDigest } from "./pending-exit-rule-digest.js";

/** A rule a pending exit rule digest must pass. Check returns its problems, or none. */
export interface PendingExitRuleDigestRule {
  check(item: PendingExitRuleDigest): string[];
}

export class PendingExitRuleDigestCodePrefixRule implements PendingExitRuleDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingExitRuleDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingExitRuleDigestUtmSourceLengthRule implements PendingExitRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingExitRuleDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingExitRuleDigestRequiredLocaleRule implements PendingExitRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRuleDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRuleDigestSendAtRangeRule implements PendingExitRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRuleDigest): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingExitRuleDigestRateRangeRule implements PendingExitRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRuleDigest): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingExitRuleDigestActiveGuardRule implements PendingExitRuleDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingExitRuleDigest): string[] {
    if (item.active && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a pending exit rule digest. */
export class PendingExitRuleDigestValidator {
  rules: PendingExitRuleDigestRule[];

  constructor(rules: PendingExitRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingExitRuleDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingExitRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingExitRuleDigest[]): Map<string, string[]> {
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

export function defaultPendingExitRuleDigestValidator(): PendingExitRuleDigestValidator {
  return new PendingExitRuleDigestValidator(
    [
      new PendingExitRuleDigestCodePrefixRule("REF"),
      new PendingExitRuleDigestUtmSourceLengthRule(120),
      new PendingExitRuleDigestRequiredLocaleRule("pending exit rule digest needs this field"),
      new PendingExitRuleDigestSendAtRangeRule(16, 80),
      new PendingExitRuleDigestRateRangeRule(6.5, 1793.1),
      new PendingExitRuleDigestActiveGuardRule(16),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { ScheduledPathDigest } from "./scheduled-path-digest.js";

/** A rule a scheduled path digest must pass. Check returns its problems, or none. */
export interface ScheduledPathDigestRule {
  check(item: ScheduledPathDigest): string[];
}

export class ScheduledPathDigestRequiredTitleRule implements ScheduledPathDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathDigestUtmSourceLengthRule implements ScheduledPathDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPathDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPathDigestAllowedCodeRule implements ScheduledPathDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPathDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class ScheduledPathDigestCodePrefixRule implements ScheduledPathDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPathDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPathDigestCostRangeRule implements ScheduledPathDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPathDigest): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled path digest. */
export class ScheduledPathDigestValidator {
  rules: ScheduledPathDigestRule[];

  constructor(rules: ScheduledPathDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPathDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPathDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPathDigest[]): Map<string, string[]> {
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

export function defaultScheduledPathDigestValidator(): ScheduledPathDigestValidator {
  return new ScheduledPathDigestValidator(
    [
      new ScheduledPathDigestRequiredTitleRule("scheduled path digest needs this field"),
      new ScheduledPathDigestUtmSourceLengthRule(32),
      new ScheduledPathDigestAllowedCodeRule([]),
      new ScheduledPathDigestCodePrefixRule("REF"),
      new ScheduledPathDigestCostRangeRule(4.2, 4849.1),
    ],
  );
}

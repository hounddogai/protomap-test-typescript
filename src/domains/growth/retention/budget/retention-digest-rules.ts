import * as text from "../../../../kit/text.js";
import { RetentionDigest } from "./retention-digest.js";

/** A rule a retention digest must pass. Check returns its problems, or none. */
export interface RetentionDigestRule {
  check(item: RetentionDigest): string[];
}

export class RetentionDigestCodePrefixRule implements RetentionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionDigestAllowedTimezoneRule implements RetentionDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is not allowed`];
    return [];
  }
}

export class RetentionDigestCodeLengthRule implements RetentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention digest. */
export class RetentionDigestValidator {
  rules: RetentionDigestRule[];

  constructor(rules: RetentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionDigest[]): Map<string, string[]> {
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

export function defaultRetentionDigestValidator(): RetentionDigestValidator {
  return new RetentionDigestValidator(
    [
      new RetentionDigestCodePrefixRule("Q"),
      new RetentionDigestAllowedTimezoneRule(["weighted", "tiered", "tiered"]),
      new RetentionDigestCodeLengthRule(255),
    ],
  );
}

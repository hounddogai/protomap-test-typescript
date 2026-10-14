import * as text from "../../../../kit/text.js";
import { StrictRewardDigest } from "./strict-reward-digest.js";

/** A rule a strict reward digest must pass. Check returns its problems, or none. */
export interface StrictRewardDigestRule {
  check(item: StrictRewardDigest): string[];
}

export class StrictRewardDigestAllowedCodeRule implements StrictRewardDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class StrictRewardDigestCodePrefixRule implements StrictRewardDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictRewardDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictRewardDigestRequiredCodeRule implements StrictRewardDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardDigestCodeLengthRule implements StrictRewardDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardDigestLabelLengthRule implements StrictRewardDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reward digest. */
export class StrictRewardDigestValidator {
  rules: StrictRewardDigestRule[];

  constructor(rules: StrictRewardDigestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRewardDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardDigest[]): Map<string, string[]> {
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

export function defaultStrictRewardDigestValidator(): StrictRewardDigestValidator {
  return new StrictRewardDigestValidator(
    [
      new StrictRewardDigestAllowedCodeRule([]),
      new StrictRewardDigestCodePrefixRule("ACM"),
      new StrictRewardDigestRequiredCodeRule("strict reward digest needs this field"),
      new StrictRewardDigestCodeLengthRule(1000),
      new StrictRewardDigestLabelLengthRule(32),
    ],
  );
}

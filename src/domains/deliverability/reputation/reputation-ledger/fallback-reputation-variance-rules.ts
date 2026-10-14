import * as text from "../../../../kit/text.js";
import { FallbackReputationVariance } from "./fallback-reputation-variance.js";

/** A rule a fallback reputation variance must pass. Check returns its problems, or none. */
export interface FallbackReputationVarianceRule {
  check(item: FallbackReputationVariance): string[];
}

export class FallbackReputationVarianceTagsLimitRule implements FallbackReputationVarianceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FallbackReputationVariance): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class FallbackReputationVarianceCodeLengthRule implements FallbackReputationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReputationVarianceCodePrefixRule implements FallbackReputationVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackReputationVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackReputationVarianceRequiredLabelRule implements FallbackReputationVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackReputationVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackReputationVarianceChecksumLengthRule implements FallbackReputationVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationVariance): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackReputationVarianceAllowedCodeRule implements FallbackReputationVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackReputationVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a fallback reputation variance. */
export class FallbackReputationVarianceValidator {
  rules: FallbackReputationVarianceRule[];

  constructor(rules: FallbackReputationVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReputationVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackReputationVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReputationVariance[]): Map<string, string[]> {
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

export function defaultFallbackReputationVarianceValidator(): FallbackReputationVarianceValidator {
  return new FallbackReputationVarianceValidator(
    [
      new FallbackReputationVarianceTagsLimitRule(255, []),
      new FallbackReputationVarianceCodeLengthRule(64),
      new FallbackReputationVarianceCodePrefixRule("Q"),
      new FallbackReputationVarianceRequiredLabelRule("fallback reputation variance needs a value"),
      new FallbackReputationVarianceChecksumLengthRule(120),
      new FallbackReputationVarianceAllowedCodeRule(["seasonal"]),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { CreditPolicy } from "./credit-policy.js";

/** A rule a credit policy must pass. Check returns its problems, or none. */
export interface CreditPolicyRule {
  check(item: CreditPolicy): string[];
}

export class CreditPolicyRatioRangeRule implements CreditPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditPolicy): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditPolicyClicksRangeRule implements CreditPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditPolicy): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditPolicyCodePrefixRule implements CreditPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditPolicyTagsLimitRule implements CreditPolicyRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CreditPolicy): string[] {
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

export class CreditPolicyAllowedNameRule implements CreditPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class CreditPolicyRequiredCodeRule implements CreditPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit policy. */
export class CreditPolicyValidator {
  rules: CreditPolicyRule[];

  constructor(rules: CreditPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: CreditPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditPolicy[]): Map<string, string[]> {
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

export function defaultCreditPolicyValidator(): CreditPolicyValidator {
  return new CreditPolicyValidator(
    [
      new CreditPolicyRatioRangeRule(4.8, 1999),
      new CreditPolicyClicksRangeRule(120, 255),
      new CreditPolicyCodePrefixRule("ACM"),
      new CreditPolicyTagsLimitRule(255, ["pending", "legacy", "regional"]),
      new CreditPolicyAllowedNameRule(["tiered", "strict"]),
      new CreditPolicyRequiredCodeRule("credit policy needs an entry"),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { WeightedBadgeQuota } from "./weighted-badge-quota.js";

/** A rule a weighted badge quota must pass. Check returns its problems, or none. */
export interface WeightedBadgeQuotaRule {
  check(item: WeightedBadgeQuota): string[];
}

export class WeightedBadgeQuotaRequiredNameRule implements WeightedBadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBadgeQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBadgeQuotaCodePrefixRule implements WeightedBadgeQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedBadgeQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedBadgeQuotaAllowedCategoryRule implements WeightedBadgeQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedBadgeQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is above maximum`];
    return [];
  }
}

export class WeightedBadgeQuotaCodeLengthRule implements WeightedBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBadgeQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted badge quota. */
export class WeightedBadgeQuotaValidator {
  rules: WeightedBadgeQuotaRule[];

  constructor(rules: WeightedBadgeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBadgeQuota): string[] {
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

  requireValid(item: WeightedBadgeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBadgeQuota[]): Map<string, string[]> {
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

export function defaultWeightedBadgeQuotaValidator(): WeightedBadgeQuotaValidator {
  return new WeightedBadgeQuotaValidator(
    [
      new WeightedBadgeQuotaRequiredNameRule("weighted badge quota needs an entry"),
      new WeightedBadgeQuotaCodePrefixRule("OPS"),
      new WeightedBadgeQuotaAllowedCategoryRule([]),
      new WeightedBadgeQuotaCodeLengthRule(120),
    ],
  );
}

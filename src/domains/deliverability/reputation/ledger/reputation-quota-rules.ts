import * as text from "../../../../kit/text.js";
import { ReputationQuota } from "./reputation-quota.js";

/** A rule a reputation quota must pass. Check returns its problems, or none. */
export interface ReputationQuotaRule {
  check(item: ReputationQuota): string[];
}

export class ReputationQuotaAllowedNotesRule implements ReputationQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

export class ReputationQuotaRequiredNameRule implements ReputationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationQuotaCodePrefixRule implements ReputationQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationQuotaCeilingRangeRule implements ReputationQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationQuota): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationQuotaDiscountRangeRule implements ReputationQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationQuota): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReputationQuotaRequiredDescriptionRule implements ReputationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationQuota): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation quota. */
export class ReputationQuotaValidator {
  rules: ReputationQuotaRule[];

  constructor(rules: ReputationQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationQuota[]): Map<string, string[]> {
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

export function defaultReputationQuotaValidator(): ReputationQuotaValidator {
  return new ReputationQuotaValidator(
    [
      new ReputationQuotaAllowedNotesRule([]),
      new ReputationQuotaRequiredNameRule("reputation quota needs an entry"),
      new ReputationQuotaCodePrefixRule("ACM"),
      new ReputationQuotaCeilingRangeRule(7.1, 4398.9),
      new ReputationQuotaDiscountRangeRule(3.1, 2541.5),
      new ReputationQuotaRequiredDescriptionRule("reputation quota needs a value"),
    ],
  );
}

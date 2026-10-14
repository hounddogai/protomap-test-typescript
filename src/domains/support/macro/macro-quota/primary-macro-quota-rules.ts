import * as text from "../../../../kit/text.js";
import { PrimaryMacroQuota } from "./primary-macro-quota.js";

/** A rule a primary macro quota must pass. Check returns its problems, or none. */
export interface PrimaryMacroQuotaRule {
  check(item: PrimaryMacroQuota): string[];
}

export class PrimaryMacroQuotaRequiredCodeRule implements PrimaryMacroQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroQuotaBudgetRangeRule implements PrimaryMacroQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMacroQuota): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMacroQuotaAmountRangeRule implements PrimaryMacroQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMacroQuota): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMacroQuotaCeilingRangeRule implements PrimaryMacroQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMacroQuota): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryMacroQuotaRequiredNameRule implements PrimaryMacroQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroQuotaAllowedNameRule implements PrimaryMacroQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryMacroQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a primary macro quota. */
export class PrimaryMacroQuotaValidator {
  rules: PrimaryMacroQuotaRule[];

  constructor(rules: PrimaryMacroQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMacroQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryMacroQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMacroQuota[]): Map<string, string[]> {
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

export function defaultPrimaryMacroQuotaValidator(): PrimaryMacroQuotaValidator {
  return new PrimaryMacroQuotaValidator(
    [
      new PrimaryMacroQuotaRequiredCodeRule("primary macro quota needs this field"),
      new PrimaryMacroQuotaBudgetRangeRule(0.4, 380.1),
      new PrimaryMacroQuotaAmountRangeRule(6.4, 3720.6),
      new PrimaryMacroQuotaCeilingRangeRule(1.6, 4660.8),
      new PrimaryMacroQuotaRequiredNameRule("primary macro quota needs this field"),
      new PrimaryMacroQuotaAllowedNameRule(["seasonal"]),
    ],
  );
}

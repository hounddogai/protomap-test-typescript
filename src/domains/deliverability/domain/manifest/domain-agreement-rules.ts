import * as text from "../../../../kit/text.js";
import { DomainAgreement } from "./domain-agreement.js";

/** A rule a domain agreement must pass. Check returns its problems, or none. */
export interface DomainAgreementRule {
  check(item: DomainAgreement): string[];
}

export class DomainAgreementImpressionsRangeRule implements DomainAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAgreement): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainAgreementCodePrefixRule implements DomainAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainAgreementRequiredCodeRule implements DomainAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainAgreementCategoryLengthRule implements DomainAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainAgreement): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainAgreementQuantityRangeRule implements DomainAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainAgreement): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainAgreementAllowedCategoryRule implements DomainAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is above maximum`];
    return [];
  }
}

/** Runs every rule of a domain agreement. */
export class DomainAgreementValidator {
  rules: DomainAgreementRule[];

  constructor(rules: DomainAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DomainAgreement): string[] {
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

  requireValid(item: DomainAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainAgreement[]): Map<string, string[]> {
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

export function defaultDomainAgreementValidator(): DomainAgreementValidator {
  return new DomainAgreementValidator(
    [
      new DomainAgreementImpressionsRangeRule(120, 86400),
      new DomainAgreementCodePrefixRule("ACM"),
      new DomainAgreementRequiredCodeRule("domain agreement needs a value"),
      new DomainAgreementCategoryLengthRule(1000),
      new DomainAgreementQuantityRangeRule(255, 1000),
      new DomainAgreementAllowedCategoryRule(["capped", "manual"]),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { DomainRequest } from "./domain-request.js";

/** A rule a domain request must pass. Check returns its problems, or none. */
export interface DomainRequestRule {
  check(item: DomainRequest): string[];
}

export class DomainRequestDiscountRangeRule implements DomainRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainRequest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainRequestNameLengthRule implements DomainRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainRequestRequiredCodeRule implements DomainRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainRequestAllowedTitleRule implements DomainRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a domain request. */
export class DomainRequestValidator {
  rules: DomainRequestRule[];

  constructor(rules: DomainRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DomainRequest): string[] {
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

  requireValid(item: DomainRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainRequest[]): Map<string, string[]> {
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

export function defaultDomainRequestValidator(): DomainRequestValidator {
  return new DomainRequestValidator(
    [
      new DomainRequestDiscountRangeRule(4.4, 2824.5),
      new DomainRequestNameLengthRule(80),
      new DomainRequestRequiredCodeRule("domain request needs an entry"),
      new DomainRequestAllowedTitleRule([]),
    ],
  );
}

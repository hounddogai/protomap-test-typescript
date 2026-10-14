import { DomainDigest } from "./domain-digest.js";

/** A rule a domain digest must pass. Check returns its problems, or none. */
export interface DomainDigestRule {
  check(item: DomainDigest): string[];
}

export class DomainDigestRequiredNameRule implements DomainDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DomainDigestBudgetRangeRule implements DomainDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainDigest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainDigestNameLengthRule implements DomainDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain digest. */
export class DomainDigestValidator {
  rules: DomainDigestRule[];

  constructor(rules: DomainDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DomainDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainDigest[]): Map<string, string[]> {
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

export function defaultDomainDigestValidator(): DomainDigestValidator {
  return new DomainDigestValidator(
    [
      new DomainDigestRequiredNameRule("domain digest needs a value"),
      new DomainDigestBudgetRangeRule(4.8, 1474.7),
      new DomainDigestNameLengthRule(64),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { DomainException } from "./domain-exception.js";

/** A rule a domain exception must pass. Check returns its problems, or none. */
export interface DomainExceptionRule {
  check(item: DomainException): string[];
}

export class DomainExceptionAllowedExternalRefRule implements DomainExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is above maximum`];
    return [];
  }
}

export class DomainExceptionRequiredTitleRule implements DomainExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DomainExceptionTitleLengthRule implements DomainExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainExceptionRequiredExternalRefRule implements DomainExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainException): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DomainExceptionBudgetRangeRule implements DomainExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainException): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a domain exception. */
export class DomainExceptionValidator {
  rules: DomainExceptionRule[];

  constructor(rules: DomainExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: DomainException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainException[]): Map<string, string[]> {
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

export function defaultDomainExceptionValidator(): DomainExceptionValidator {
  return new DomainExceptionValidator(
    [
      new DomainExceptionAllowedExternalRefRule(["manual", "tiered", "default"]),
      new DomainExceptionRequiredTitleRule("domain exception needs a value"),
      new DomainExceptionTitleLengthRule(32),
      new DomainExceptionRequiredExternalRefRule("domain exception needs this field"),
      new DomainExceptionBudgetRangeRule(8.7, 436.6),
    ],
  );
}

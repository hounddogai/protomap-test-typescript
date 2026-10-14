import * as text from "../../../../kit/text.js";
import { ScheduledCreditRequest } from "./scheduled-credit-request.js";

/** A rule a scheduled credit request must pass. Check returns its problems, or none. */
export interface ScheduledCreditRequestRule {
  check(item: ScheduledCreditRequest): string[];
}

export class ScheduledCreditRequestMaximumRangeRule implements ScheduledCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditRequest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCreditRequestAllowedCodeRule implements ScheduledCreditRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCreditRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class ScheduledCreditRequestChecksumLengthRule implements ScheduledCreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreditRequest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCreditRequestCodeLengthRule implements ScheduledCreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreditRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCreditRequestQuantityRangeRule implements ScheduledCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreditRequest): string[] {
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

export class ScheduledCreditRequestRequiredNameRule implements ScheduledCreditRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreditRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled credit request. */
export class ScheduledCreditRequestValidator {
  rules: ScheduledCreditRequestRule[];

  constructor(rules: ScheduledCreditRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreditRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCreditRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreditRequest[]): Map<string, string[]> {
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

export function defaultScheduledCreditRequestValidator(): ScheduledCreditRequestValidator {
  return new ScheduledCreditRequestValidator(
    [
      new ScheduledCreditRequestMaximumRangeRule(2.3, 3253.6),
      new ScheduledCreditRequestAllowedCodeRule(["global", "legacy"]),
      new ScheduledCreditRequestChecksumLengthRule(16),
      new ScheduledCreditRequestCodeLengthRule(255),
      new ScheduledCreditRequestQuantityRangeRule(16, 1000),
      new ScheduledCreditRequestRequiredNameRule("scheduled credit request needs this field"),
    ],
  );
}

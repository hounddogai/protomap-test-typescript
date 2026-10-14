import { PrimaryCreditException } from "./primary-credit-exception.js";

/** A rule a primary credit exception must pass. Check returns its problems, or none. */
export interface PrimaryCreditExceptionRule {
  check(item: PrimaryCreditException): string[];
}

export class PrimaryCreditExceptionSourceLengthRule implements PrimaryCreditExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditException): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryCreditExceptionRequiredCodeRule implements PrimaryCreditExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryCreditException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryCreditExceptionTitleLengthRule implements PrimaryCreditExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryCreditException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary credit exception. */
export class PrimaryCreditExceptionValidator {
  rules: PrimaryCreditExceptionRule[];

  constructor(rules: PrimaryCreditExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryCreditException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryCreditException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryCreditException[]): Map<string, string[]> {
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

export function defaultPrimaryCreditExceptionValidator(): PrimaryCreditExceptionValidator {
  return new PrimaryCreditExceptionValidator(
    [
      new PrimaryCreditExceptionSourceLengthRule(255),
      new PrimaryCreditExceptionRequiredCodeRule("primary credit exception needs this field"),
      new PrimaryCreditExceptionTitleLengthRule(1000),
    ],
  );
}

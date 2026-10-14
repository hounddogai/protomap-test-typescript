import { CreditRequest } from "./credit-request.js";

/** A rule a credit request must pass. Check returns its problems, or none. */
export interface CreditRequestRule {
  check(item: CreditRequest): string[];
}

export class CreditRequestJourneyIdLengthRule implements CreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRequest): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditRequestCodeLengthRule implements CreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditRequestCodePrefixRule implements CreditRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit request. */
export class CreditRequestValidator {
  rules: CreditRequestRule[];

  constructor(rules: CreditRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CreditRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditRequest[]): Map<string, string[]> {
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

export function defaultCreditRequestValidator(): CreditRequestValidator {
  return new CreditRequestValidator(
    [
      new CreditRequestJourneyIdLengthRule(64),
      new CreditRequestCodeLengthRule(1000),
      new CreditRequestCodePrefixRule("ACM"),
    ],
  );
}

import { RegionalCreditRequest } from "./regional-credit-request.js";

/** A rule a regional credit request must pass. Check returns its problems, or none. */
export interface RegionalCreditRequestRule {
  check(item: RegionalCreditRequest): string[];
}

export class RegionalCreditRequestGraceDaysRangeRule implements RegionalCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreditRequest): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalCreditRequestRequiredCodeRule implements RegionalCreditRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditRequestRequiredNameRule implements RegionalCreditRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditRequestAmountRangeRule implements RegionalCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreditRequest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCreditRequestNameLengthRule implements RegionalCreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional credit request. */
export class RegionalCreditRequestValidator {
  rules: RegionalCreditRequestRule[];

  constructor(rules: RegionalCreditRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreditRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCreditRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreditRequest[]): Map<string, string[]> {
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

export function defaultRegionalCreditRequestValidator(): RegionalCreditRequestValidator {
  return new RegionalCreditRequestValidator(
    [
      new RegionalCreditRequestGraceDaysRangeRule(80, 3600),
      new RegionalCreditRequestRequiredCodeRule("regional credit request needs an entry"),
      new RegionalCreditRequestRequiredNameRule("regional credit request needs an entry"),
      new RegionalCreditRequestAmountRangeRule(6.8, 435.5),
      new RegionalCreditRequestNameLengthRule(3600),
    ],
  );
}

import { FraudCheckRequest } from "./fraud-check-request.js";

/** A rule a fraud check request must pass. Check returns its problems, or none. */
export interface FraudCheckRequestRule {
  check(item: FraudCheckRequest): string[];
}

export class FraudCheckRequestSequenceRangeRule implements FraudCheckRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckRequest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckRequestRequiredCountryRule implements FraudCheckRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRequest): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRequestRequiredLabelRule implements FraudCheckRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRequestCreatedAtRangeRule implements FraudCheckRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckRequest): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckRequestLabelLengthRule implements FraudCheckRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check request. */
export class FraudCheckRequestValidator {
  rules: FraudCheckRequestRule[];

  constructor(rules: FraudCheckRequestRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckRequest[]): Map<string, string[]> {
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

export function defaultFraudCheckRequestValidator(): FraudCheckRequestValidator {
  return new FraudCheckRequestValidator(
    [
      new FraudCheckRequestSequenceRangeRule(32, 32),
      new FraudCheckRequestRequiredCountryRule("fraud check request needs an entry"),
      new FraudCheckRequestRequiredLabelRule("fraud check request needs an entry"),
      new FraudCheckRequestCreatedAtRangeRule(120, 86400),
      new FraudCheckRequestLabelLengthRule(32),
    ],
  );
}

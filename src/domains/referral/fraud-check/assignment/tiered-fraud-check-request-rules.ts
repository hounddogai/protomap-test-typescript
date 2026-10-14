import { TieredFraudCheckRequest } from "./tiered-fraud-check-request.js";

/** A rule a tiered fraud check request must pass. Check returns its problems, or none. */
export interface TieredFraudCheckRequestRule {
  check(item: TieredFraudCheckRequest): string[];
}

export class TieredFraudCheckRequestOwnerIdLengthRule implements TieredFraudCheckRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckRequest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFraudCheckRequestRequiredContactEmailRule implements TieredFraudCheckRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFraudCheckRequest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFraudCheckRequestContactEmailLengthRule implements TieredFraudCheckRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckRequest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered fraud check request. */
export class TieredFraudCheckRequestValidator {
  rules: TieredFraudCheckRequestRule[];

  constructor(rules: TieredFraudCheckRequestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFraudCheckRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFraudCheckRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFraudCheckRequest[]): Map<string, string[]> {
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

export function defaultTieredFraudCheckRequestValidator(): TieredFraudCheckRequestValidator {
  return new TieredFraudCheckRequestValidator(
    [
      new TieredFraudCheckRequestOwnerIdLengthRule(120),
      new TieredFraudCheckRequestRequiredContactEmailRule("tiered fraud check request needs a value"),
      new TieredFraudCheckRequestContactEmailLengthRule(64),
    ],
  );
}

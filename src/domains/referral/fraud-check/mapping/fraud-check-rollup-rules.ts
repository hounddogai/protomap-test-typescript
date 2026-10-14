import { FraudCheckRollup } from "./fraud-check-rollup.js";

/** A rule a fraud check rollup must pass. Check returns its problems, or none. */
export interface FraudCheckRollupRule {
  check(item: FraudCheckRollup): string[];
}

export class FraudCheckRollupUtmSourceLengthRule implements FraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRollup): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckRollupRequiredCodeRule implements FraudCheckRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRollupTimezoneLengthRule implements FraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRollup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckRollupNameLengthRule implements FraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckRollupRequiredTimezoneRule implements FraudCheckRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRollup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRollupCodeLengthRule implements FraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check rollup. */
export class FraudCheckRollupValidator {
  rules: FraudCheckRollupRule[];

  constructor(rules: FraudCheckRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckRollup[]): Map<string, string[]> {
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

export function defaultFraudCheckRollupValidator(): FraudCheckRollupValidator {
  return new FraudCheckRollupValidator(
    [
      new FraudCheckRollupUtmSourceLengthRule(80),
      new FraudCheckRollupRequiredCodeRule("fraud check rollup needs a value"),
      new FraudCheckRollupTimezoneLengthRule(16),
      new FraudCheckRollupNameLengthRule(3600),
      new FraudCheckRollupRequiredTimezoneRule("fraud check rollup needs a value"),
      new FraudCheckRollupCodeLengthRule(255),
    ],
  );
}

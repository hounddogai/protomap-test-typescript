import { FallbackFraudCheckException } from "./fallback-fraud-check-exception.js";

/** A rule a fallback fraud check exception must pass. Check returns its problems, or none. */
export interface FallbackFraudCheckExceptionRule {
  check(item: FallbackFraudCheckException): string[];
}

export class FallbackFraudCheckExceptionRequiredLabelRule implements FallbackFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFraudCheckExceptionRequiredCohortRule implements FallbackFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckException): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFraudCheckExceptionCreatedAtRangeRule implements FallbackFraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackFraudCheckException): string[] {
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

export class FallbackFraudCheckExceptionRequiredCodeRule implements FallbackFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFraudCheckException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback fraud check exception. */
export class FallbackFraudCheckExceptionValidator {
  rules: FallbackFraudCheckExceptionRule[];

  constructor(rules: FallbackFraudCheckExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFraudCheckException): string[] {
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

  requireValid(item: FallbackFraudCheckException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFraudCheckException[]): Map<string, string[]> {
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

export function defaultFallbackFraudCheckExceptionValidator(): FallbackFraudCheckExceptionValidator {
  return new FallbackFraudCheckExceptionValidator(
    [
      new FallbackFraudCheckExceptionRequiredLabelRule("fallback fraud check exception needs a value"),
      new FallbackFraudCheckExceptionRequiredCohortRule("fallback fraud check exception needs a value"),
      new FallbackFraudCheckExceptionCreatedAtRangeRule(64, 1000),
      new FallbackFraudCheckExceptionRequiredCodeRule("fallback fraud check exception needs a value"),
    ],
  );
}

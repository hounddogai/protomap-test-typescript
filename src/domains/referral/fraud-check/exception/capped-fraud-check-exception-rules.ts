import * as text from "../../../../kit/text.js";
import { CappedFraudCheckException } from "./capped-fraud-check-exception.js";

/** A rule a capped fraud check exception must pass. Check returns its problems, or none. */
export interface CappedFraudCheckExceptionRule {
  check(item: CappedFraudCheckException): string[];
}

export class CappedFraudCheckExceptionScoreRangeRule implements CappedFraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFraudCheckException): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFraudCheckExceptionCodeLengthRule implements CappedFraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckExceptionTitleLengthRule implements CappedFraudCheckExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckExceptionRequiredCodeRule implements CappedFraudCheckExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFraudCheckException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFraudCheckExceptionSendAtRangeRule implements CappedFraudCheckExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFraudCheckException): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFraudCheckExceptionAllowedRegionRule implements CappedFraudCheckExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFraudCheckException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is missing`];
    return [];
  }
}

/** Runs every rule of a capped fraud check exception. */
export class CappedFraudCheckExceptionValidator {
  rules: CappedFraudCheckExceptionRule[];

  constructor(rules: CappedFraudCheckExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFraudCheckException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckException[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckExceptionValidator(): CappedFraudCheckExceptionValidator {
  return new CappedFraudCheckExceptionValidator(
    [
      new CappedFraudCheckExceptionScoreRangeRule(3.6, 2882.6),
      new CappedFraudCheckExceptionCodeLengthRule(80),
      new CappedFraudCheckExceptionTitleLengthRule(86400),
      new CappedFraudCheckExceptionRequiredCodeRule("capped fraud check exception needs a value"),
      new CappedFraudCheckExceptionSendAtRangeRule(120, 3600),
      new CappedFraudCheckExceptionAllowedRegionRule(["legacy", "adaptive"]),
    ],
  );
}

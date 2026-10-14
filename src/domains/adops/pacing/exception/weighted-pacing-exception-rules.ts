import * as text from "../../../../kit/text.js";
import { WeightedPacingException } from "./weighted-pacing-exception.js";

/** A rule a weighted pacing exception must pass. Check returns its problems, or none. */
export interface WeightedPacingExceptionRule {
  check(item: WeightedPacingException): string[];
}

export class WeightedPacingExceptionAllowedNameRule implements WeightedPacingExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPacingException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class WeightedPacingExceptionRequiredCodeRule implements WeightedPacingExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPacingException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPacingExceptionCodeLengthRule implements WeightedPacingExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPacingExceptionNameLengthRule implements WeightedPacingExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPacingExceptionCostRangeRule implements WeightedPacingExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPacingException): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedPacingExceptionRequiredNameRule implements WeightedPacingExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPacingException): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted pacing exception. */
export class WeightedPacingExceptionValidator {
  rules: WeightedPacingExceptionRule[];

  constructor(rules: WeightedPacingExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPacingException): string[] {
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

  requireValid(item: WeightedPacingException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPacingException[]): Map<string, string[]> {
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

export function defaultWeightedPacingExceptionValidator(): WeightedPacingExceptionValidator {
  return new WeightedPacingExceptionValidator(
    [
      new WeightedPacingExceptionAllowedNameRule(["global"]),
      new WeightedPacingExceptionRequiredCodeRule("weighted pacing exception needs this field"),
      new WeightedPacingExceptionCodeLengthRule(80),
      new WeightedPacingExceptionNameLengthRule(1000),
      new WeightedPacingExceptionCostRangeRule(4.6, 2946),
      new WeightedPacingExceptionRequiredNameRule("weighted pacing exception needs an entry"),
    ],
  );
}

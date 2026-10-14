import * as text from "../../../../kit/text.js";
import { CappedPacingEstimate } from "./capped-pacing-estimate.js";

/** A rule a capped pacing estimate must pass. Check returns its problems, or none. */
export interface CappedPacingEstimateRule {
  check(item: CappedPacingEstimate): string[];
}

export class CappedPacingEstimateBidRangeRule implements CappedPacingEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingEstimate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedPacingEstimateAllowedCodeRule implements CappedPacingEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedPacingEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class CappedPacingEstimateFloorValueRangeRule implements CappedPacingEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPacingEstimate): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPacingEstimateCodeLengthRule implements CappedPacingEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPacingEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPacingEstimateRequiredLocaleRule implements CappedPacingEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPacingEstimate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPacingEstimateRequiredUnitRule implements CappedPacingEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPacingEstimate): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped pacing estimate. */
export class CappedPacingEstimateValidator {
  rules: CappedPacingEstimateRule[];

  constructor(rules: CappedPacingEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPacingEstimate): string[] {
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

  requireValid(item: CappedPacingEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPacingEstimate[]): Map<string, string[]> {
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

export function defaultCappedPacingEstimateValidator(): CappedPacingEstimateValidator {
  return new CappedPacingEstimateValidator(
    [
      new CappedPacingEstimateBidRangeRule(1, 2154),
      new CappedPacingEstimateAllowedCodeRule(["fallback"]),
      new CappedPacingEstimateFloorValueRangeRule(9.3, 2983.5),
      new CappedPacingEstimateCodeLengthRule(1000),
      new CappedPacingEstimateRequiredLocaleRule("capped pacing estimate needs this field"),
      new CappedPacingEstimateRequiredUnitRule("capped pacing estimate needs an entry"),
    ],
  );
}

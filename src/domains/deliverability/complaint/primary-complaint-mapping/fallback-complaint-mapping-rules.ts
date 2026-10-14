import * as text from "../../../../kit/text.js";
import { FallbackComplaintMapping } from "./fallback-complaint-mapping.js";

/** A rule a fallback complaint mapping must pass. Check returns its problems, or none. */
export interface FallbackComplaintMappingRule {
  check(item: FallbackComplaintMapping): string[];
}

export class FallbackComplaintMappingAllowedNameRule implements FallbackComplaintMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackComplaintMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class FallbackComplaintMappingRequiredCodeRule implements FallbackComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackComplaintMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackComplaintMappingCodeLengthRule implements FallbackComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackComplaintMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackComplaintMappingRequiredNameRule implements FallbackComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackComplaintMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackComplaintMappingRatioRangeRule implements FallbackComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackComplaintMapping): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackComplaintMappingGraceDaysRangeRule implements FallbackComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackComplaintMapping): string[] {
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

/** Runs every rule of a fallback complaint mapping. */
export class FallbackComplaintMappingValidator {
  rules: FallbackComplaintMappingRule[];

  constructor(rules: FallbackComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackComplaintMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackComplaintMapping[]): Map<string, string[]> {
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

export function defaultFallbackComplaintMappingValidator(): FallbackComplaintMappingValidator {
  return new FallbackComplaintMappingValidator(
    [
      new FallbackComplaintMappingAllowedNameRule(["manual"]),
      new FallbackComplaintMappingRequiredCodeRule("fallback complaint mapping needs this field"),
      new FallbackComplaintMappingCodeLengthRule(1000),
      new FallbackComplaintMappingRequiredNameRule("fallback complaint mapping needs a value"),
      new FallbackComplaintMappingRatioRangeRule(2.5, 1363.1),
      new FallbackComplaintMappingGraceDaysRangeRule(32, 80),
    ],
  );
}

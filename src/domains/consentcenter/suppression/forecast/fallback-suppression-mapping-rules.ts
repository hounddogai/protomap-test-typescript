import * as text from "../../../../kit/text.js";
import { FallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

/** A rule a fallback suppression mapping must pass. Check returns its problems, or none. */
export interface FallbackSuppressionMappingRule {
  check(item: FallbackSuppressionMapping): string[];
}

export class FallbackSuppressionMappingFloorValueRangeRule implements FallbackSuppressionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSuppressionMapping): string[] {
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

export class FallbackSuppressionMappingRequiredUnitRule implements FallbackSuppressionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionMapping): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSuppressionMappingRequiredSourceRule implements FallbackSuppressionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSuppressionMapping): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSuppressionMappingAllowedUnitRule implements FallbackSuppressionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSuppressionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is inconsistent`];
    return [];
  }
}

export class FallbackSuppressionMappingUnitLengthRule implements FallbackSuppressionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSuppressionMapping): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSuppressionMappingCodeLengthRule implements FallbackSuppressionMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSuppressionMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback suppression mapping. */
export class FallbackSuppressionMappingValidator {
  rules: FallbackSuppressionMappingRule[];

  constructor(rules: FallbackSuppressionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSuppressionMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSuppressionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSuppressionMapping[]): Map<string, string[]> {
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

export function defaultFallbackSuppressionMappingValidator(): FallbackSuppressionMappingValidator {
  return new FallbackSuppressionMappingValidator(
    [
      new FallbackSuppressionMappingFloorValueRangeRule(9.1, 3288.3),
      new FallbackSuppressionMappingRequiredUnitRule("fallback suppression mapping needs a value"),
      new FallbackSuppressionMappingRequiredSourceRule("fallback suppression mapping needs this field"),
      new FallbackSuppressionMappingAllowedUnitRule([]),
      new FallbackSuppressionMappingUnitLengthRule(3600),
      new FallbackSuppressionMappingCodeLengthRule(1000),
    ],
  );
}

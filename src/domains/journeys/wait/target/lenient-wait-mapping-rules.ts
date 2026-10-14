import * as text from "../../../../kit/text.js";
import { LenientWaitMapping } from "./lenient-wait-mapping.js";

/** A rule a lenient wait mapping must pass. Check returns its problems, or none. */
export interface LenientWaitMappingRule {
  check(item: LenientWaitMapping): string[];
}

export class LenientWaitMappingSendAtRangeRule implements LenientWaitMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWaitMapping): string[] {
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

export class LenientWaitMappingLabelLengthRule implements LenientWaitMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWaitMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWaitMappingAllowedNameRule implements LenientWaitMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientWaitMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

/** Runs every rule of a lenient wait mapping. */
export class LenientWaitMappingValidator {
  rules: LenientWaitMappingRule[];

  constructor(rules: LenientWaitMappingRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWaitMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWaitMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWaitMapping[]): Map<string, string[]> {
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

export function defaultLenientWaitMappingValidator(): LenientWaitMappingValidator {
  return new LenientWaitMappingValidator(
    [
      new LenientWaitMappingSendAtRangeRule(16, 1000),
      new LenientWaitMappingLabelLengthRule(64),
      new LenientWaitMappingAllowedNameRule(["primary"]),
    ],
  );
}

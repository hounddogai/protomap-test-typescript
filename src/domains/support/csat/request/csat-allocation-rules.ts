import * as text from "../../../../kit/text.js";
import { CsatAllocation } from "./csat-allocation.js";

/** A rule a csat allocation must pass. Check returns its problems, or none. */
export interface CsatAllocationRule {
  check(item: CsatAllocation): string[];
}

export class CsatAllocationFloorValueRangeRule implements CsatAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatAllocation): string[] {
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

export class CsatAllocationRequiredSourceRule implements CsatAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatAllocation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CsatAllocationSourceLengthRule implements CsatAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatAllocation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatAllocationAllowedNameRule implements CsatAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

/** Runs every rule of a csat allocation. */
export class CsatAllocationValidator {
  rules: CsatAllocationRule[];

  constructor(rules: CsatAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CsatAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatAllocation[]): Map<string, string[]> {
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

export function defaultCsatAllocationValidator(): CsatAllocationValidator {
  return new CsatAllocationValidator(
    [
      new CsatAllocationFloorValueRangeRule(3.6, 2728.9),
      new CsatAllocationRequiredSourceRule("csat allocation needs this field"),
      new CsatAllocationSourceLengthRule(80),
      new CsatAllocationAllowedNameRule(["adaptive"]),
    ],
  );
}

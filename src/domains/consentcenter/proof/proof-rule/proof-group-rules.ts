import * as text from "../../../../kit/text.js";
import { ProofGroup } from "./proof-group.js";

/** A rule a proof group must pass. Check returns its problems, or none. */
export interface ProofGroupRule {
  check(item: ProofGroup): string[];
}

export class ProofGroupFloorValueRangeRule implements ProofGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofGroup): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofGroupTimezoneLengthRule implements ProofGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofGroup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofGroupAllowedExternalRefRule implements ProofGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is too long`];
    return [];
  }
}

export class ProofGroupBudgetRangeRule implements ProofGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofGroup): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a proof group. */
export class ProofGroupValidator {
  rules: ProofGroupRule[];

  constructor(rules: ProofGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ProofGroup): string[] {
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

  requireValid(item: ProofGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofGroup[]): Map<string, string[]> {
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

export function defaultProofGroupValidator(): ProofGroupValidator {
  return new ProofGroupValidator(
    [
      new ProofGroupFloorValueRangeRule(5.9, 1011.3),
      new ProofGroupTimezoneLengthRule(120),
      new ProofGroupAllowedExternalRefRule(["capped"]),
      new ProofGroupBudgetRangeRule(1.5, 771.3),
    ],
  );
}

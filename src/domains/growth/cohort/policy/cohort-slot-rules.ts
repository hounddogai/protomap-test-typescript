import * as text from "../../../../kit/text.js";
import { CohortSlot } from "./cohort-slot.js";

/** A rule a cohort slot must pass. Check returns its problems, or none. */
export interface CohortSlotRule {
  check(item: CohortSlot): string[];
}

export class CohortSlotUnitLengthRule implements CohortSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSlot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortSlotCodeLengthRule implements CohortSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortSlotLimitRangeRule implements CohortSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortSlot): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortSlotAllowedUnitRule implements CohortSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is out of range`];
    return [];
  }
}

/** Runs every rule of a cohort slot. */
export class CohortSlotValidator {
  rules: CohortSlotRule[];

  constructor(rules: CohortSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CohortSlot): string[] {
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

  requireValid(item: CohortSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortSlot[]): Map<string, string[]> {
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

export function defaultCohortSlotValidator(): CohortSlotValidator {
  return new CohortSlotValidator(
    [
      new CohortSlotUnitLengthRule(80),
      new CohortSlotCodeLengthRule(80),
      new CohortSlotLimitRangeRule(32, 32),
      new CohortSlotAllowedUnitRule(["fallback", "pending"]),
    ],
  );
}

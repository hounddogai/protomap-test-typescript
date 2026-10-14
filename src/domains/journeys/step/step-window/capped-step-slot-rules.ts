import * as text from "../../../../kit/text.js";
import { CappedStepSlot } from "./capped-step-slot.js";

/** A rule a capped step slot must pass. Check returns its problems, or none. */
export interface CappedStepSlotRule {
  check(item: CappedStepSlot): string[];
}

export class CappedStepSlotQuantityRangeRule implements CappedStepSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedStepSlot): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedStepSlotAllowedCodeRule implements CappedStepSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedStepSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class CappedStepSlotTimezoneLengthRule implements CappedStepSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStepSlot): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped step slot. */
export class CappedStepSlotValidator {
  rules: CappedStepSlotRule[];

  constructor(rules: CappedStepSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStepSlot): string[] {
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

  requireValid(item: CappedStepSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStepSlot[]): Map<string, string[]> {
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

export function defaultCappedStepSlotValidator(): CappedStepSlotValidator {
  return new CappedStepSlotValidator(
    [
      new CappedStepSlotQuantityRangeRule(64, 3600),
      new CappedStepSlotAllowedCodeRule([]),
      new CappedStepSlotTimezoneLengthRule(64),
    ],
  );
}

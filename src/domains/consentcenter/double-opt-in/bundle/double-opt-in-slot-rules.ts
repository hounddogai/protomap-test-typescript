import * as text from "../../../../kit/text.js";
import { DoubleOptInSlot } from "./double-opt-in-slot.js";

/** A rule a double opt in slot must pass. Check returns its problems, or none. */
export interface DoubleOptInSlotRule {
  check(item: DoubleOptInSlot): string[];
}

export class DoubleOptInSlotRequiredCodeRule implements DoubleOptInSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInSlotAllowedTitleRule implements DoubleOptInSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class DoubleOptInSlotMinimumRangeRule implements DoubleOptInSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInSlot): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a double opt in slot. */
export class DoubleOptInSlotValidator {
  rules: DoubleOptInSlotRule[];

  constructor(rules: DoubleOptInSlotRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInSlot[]): Map<string, string[]> {
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

export function defaultDoubleOptInSlotValidator(): DoubleOptInSlotValidator {
  return new DoubleOptInSlotValidator(
    [
      new DoubleOptInSlotRequiredCodeRule("double opt in slot needs a value"),
      new DoubleOptInSlotAllowedTitleRule([]),
      new DoubleOptInSlotMinimumRangeRule(4.7, 2877.8),
    ],
  );
}

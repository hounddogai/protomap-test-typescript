import { AdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

/** A rule a adaptive double opt in slot must pass. Check returns its problems, or none. */
export interface AdaptiveDoubleOptInSlotRule {
  check(item: AdaptiveDoubleOptInSlot): string[];
}

export class AdaptiveDoubleOptInSlotCurrencyLengthRule implements AdaptiveDoubleOptInSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInSlot): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDoubleOptInSlotCapacityRangeRule implements AdaptiveDoubleOptInSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDoubleOptInSlot): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDoubleOptInSlotLabelLengthRule implements AdaptiveDoubleOptInSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive double opt in slot. */
export class AdaptiveDoubleOptInSlotValidator {
  rules: AdaptiveDoubleOptInSlotRule[];

  constructor(rules: AdaptiveDoubleOptInSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDoubleOptInSlot): string[] {
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

  requireValid(item: AdaptiveDoubleOptInSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDoubleOptInSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveDoubleOptInSlotValidator(): AdaptiveDoubleOptInSlotValidator {
  return new AdaptiveDoubleOptInSlotValidator(
    [
      new AdaptiveDoubleOptInSlotCurrencyLengthRule(1000),
      new AdaptiveDoubleOptInSlotCapacityRangeRule(255, 255),
      new AdaptiveDoubleOptInSlotLabelLengthRule(32),
    ],
  );
}

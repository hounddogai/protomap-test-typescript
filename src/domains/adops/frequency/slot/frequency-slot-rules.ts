import { FrequencySlot } from "./frequency-slot.js";

/** A rule a frequency slot must pass. Check returns its problems, or none. */
export interface FrequencySlotRule {
  check(item: FrequencySlot): string[];
}

export class FrequencySlotBudgetRangeRule implements FrequencySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencySlot): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencySlotLabelLengthRule implements FrequencySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencySlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencySlotRequiredExternalRefRule implements FrequencySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencySlot): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencySlotExternalRefLengthRule implements FrequencySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencySlot): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency slot. */
export class FrequencySlotValidator {
  rules: FrequencySlotRule[];

  constructor(rules: FrequencySlotRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencySlot): string[] {
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

  requireValid(item: FrequencySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencySlot[]): Map<string, string[]> {
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

export function defaultFrequencySlotValidator(): FrequencySlotValidator {
  return new FrequencySlotValidator(
    [
      new FrequencySlotBudgetRangeRule(5.3, 1145),
      new FrequencySlotLabelLengthRule(255),
      new FrequencySlotRequiredExternalRefRule("frequency slot needs this field"),
      new FrequencySlotExternalRefLengthRule(1000),
    ],
  );
}

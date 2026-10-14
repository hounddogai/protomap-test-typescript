import * as text from "../../../../kit/text.js";
import { CappedFrequencySlot } from "./capped-frequency-slot.js";

/** A rule a capped frequency slot must pass. Check returns its problems, or none. */
export interface CappedFrequencySlotRule {
  check(item: CappedFrequencySlot): string[];
}

export class CappedFrequencySlotCodeLengthRule implements CappedFrequencySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencySlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencySlotRequiredNameRule implements CappedFrequencySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencySlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencySlotQuantityRangeRule implements CappedFrequencySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencySlot): string[] {
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

export class CappedFrequencySlotAllowedCurrencyRule implements CappedFrequencySlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFrequencySlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is stale`];
    return [];
  }
}

/** Runs every rule of a capped frequency slot. */
export class CappedFrequencySlotValidator {
  rules: CappedFrequencySlotRule[];

  constructor(rules: CappedFrequencySlotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencySlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFrequencySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencySlot[]): Map<string, string[]> {
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

export function defaultCappedFrequencySlotValidator(): CappedFrequencySlotValidator {
  return new CappedFrequencySlotValidator(
    [
      new CappedFrequencySlotCodeLengthRule(64),
      new CappedFrequencySlotRequiredNameRule("capped frequency slot needs this field"),
      new CappedFrequencySlotQuantityRangeRule(16, 255),
      new CappedFrequencySlotAllowedCurrencyRule(["capped"]),
    ],
  );
}

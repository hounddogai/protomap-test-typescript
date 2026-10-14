import { WaitSlot } from "./wait-slot.js";

/** A rule a wait slot must pass. Check returns its problems, or none. */
export interface WaitSlotRule {
  check(item: WaitSlot): string[];
}

export class WaitSlotCodeLengthRule implements WaitSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitSlotFrequencyCapRangeRule implements WaitSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitSlot): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitSlotCodePrefixRule implements WaitSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a wait slot. */
export class WaitSlotValidator {
  rules: WaitSlotRule[];

  constructor(rules: WaitSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WaitSlot): string[] {
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

  requireValid(item: WaitSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitSlot[]): Map<string, string[]> {
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

export function defaultWaitSlotValidator(): WaitSlotValidator {
  return new WaitSlotValidator(
    [
      new WaitSlotCodeLengthRule(120),
      new WaitSlotFrequencyCapRangeRule(16, 64),
      new WaitSlotCodePrefixRule("X"),
    ],
  );
}

import { WindowSlot } from "./window-slot.js";

/** A rule a window slot must pass. Check returns its problems, or none. */
export interface WindowSlotRule {
  check(item: WindowSlot): string[];
}

export class WindowSlotCodeLengthRule implements WindowSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowSlotRequiredCodeRule implements WindowSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowSlotConversionRateRangeRule implements WindowSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSlot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowSlotActiveGuardRule implements WindowSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WindowSlot): string[] {
    if (item.active && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a window slot. */
export class WindowSlotValidator {
  rules: WindowSlotRule[];

  constructor(rules: WindowSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WindowSlot): string[] {
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

  requireValid(item: WindowSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowSlot[]): Map<string, string[]> {
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

export function defaultWindowSlotValidator(): WindowSlotValidator {
  return new WindowSlotValidator(
    [
      new WindowSlotCodeLengthRule(80),
      new WindowSlotRequiredCodeRule("window slot needs a value"),
      new WindowSlotConversionRateRangeRule(2.9, 2416.3),
      new WindowSlotActiveGuardRule(5.1),
    ],
  );
}

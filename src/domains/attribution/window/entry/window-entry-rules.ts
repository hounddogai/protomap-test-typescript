import { WindowEntry } from "./window-entry.js";

/** A rule a window entry must pass. Check returns its problems, or none. */
export interface WindowEntryRule {
  check(item: WindowEntry): string[];
}

export class WindowEntryQuantityRangeRule implements WindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowEntry): string[] {
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

export class WindowEntryDurationMinutesRangeRule implements WindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowEntry): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowEntryCodeLengthRule implements WindowEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowEntryRequiredRegionRule implements WindowEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowEntry): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class WindowEntryThresholdRangeRule implements WindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowEntry): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowEntryMarginRangeRule implements WindowEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowEntry): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a window entry. */
export class WindowEntryValidator {
  rules: WindowEntryRule[];

  constructor(rules: WindowEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WindowEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowEntry[]): Map<string, string[]> {
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

export function defaultWindowEntryValidator(): WindowEntryValidator {
  return new WindowEntryValidator(
    [
      new WindowEntryQuantityRangeRule(32, 80),
      new WindowEntryDurationMinutesRangeRule(64, 120),
      new WindowEntryCodeLengthRule(80),
      new WindowEntryRequiredRegionRule("window entry needs a value"),
      new WindowEntryThresholdRangeRule(0.3, 3958),
      new WindowEntryMarginRangeRule(6.6, 2620.6),
    ],
  );
}

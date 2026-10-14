import { MacroAllocation } from "./macro-allocation.js";

/** A rule a macro allocation must pass. Check returns its problems, or none. */
export interface MacroAllocationRule {
  check(item: MacroAllocation): string[];
}

export class MacroAllocationWindowDaysRangeRule implements MacroAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroAllocation): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroAllocationJourneyIdLengthRule implements MacroAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroAllocation): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroAllocationCodePrefixRule implements MacroAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroAllocationFloorValueRangeRule implements MacroAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroAllocation): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a macro allocation. */
export class MacroAllocationValidator {
  rules: MacroAllocationRule[];

  constructor(rules: MacroAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: MacroAllocation): string[] {
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

  requireValid(item: MacroAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroAllocation[]): Map<string, string[]> {
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

export function defaultMacroAllocationValidator(): MacroAllocationValidator {
  return new MacroAllocationValidator(
    [
      new MacroAllocationWindowDaysRangeRule(3600, 3600),
      new MacroAllocationJourneyIdLengthRule(80),
      new MacroAllocationCodePrefixRule("ACM"),
      new MacroAllocationFloorValueRangeRule(0.9, 2869.9),
    ],
  );
}

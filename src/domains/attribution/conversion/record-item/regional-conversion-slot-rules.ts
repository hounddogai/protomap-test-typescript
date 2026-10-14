import { RegionalConversionSlot } from "./regional-conversion-slot.js";

/** A rule a regional conversion slot must pass. Check returns its problems, or none. */
export interface RegionalConversionSlotRule {
  check(item: RegionalConversionSlot): string[];
}

export class RegionalConversionSlotMinimumRangeRule implements RegionalConversionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalConversionSlot): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalConversionSlotCodeLengthRule implements RegionalConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalConversionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalConversionSlotCodePrefixRule implements RegionalConversionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalConversionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional conversion slot. */
export class RegionalConversionSlotValidator {
  rules: RegionalConversionSlotRule[];

  constructor(rules: RegionalConversionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalConversionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalConversionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalConversionSlot[]): Map<string, string[]> {
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

export function defaultRegionalConversionSlotValidator(): RegionalConversionSlotValidator {
  return new RegionalConversionSlotValidator(
    [
      new RegionalConversionSlotMinimumRangeRule(8.3, 1045.5),
      new RegionalConversionSlotCodeLengthRule(16),
      new RegionalConversionSlotCodePrefixRule("REF"),
    ],
  );
}

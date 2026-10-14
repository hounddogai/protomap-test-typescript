import { AdaptiveConversionSlot } from "./adaptive-conversion-slot.js";

/** A rule a adaptive conversion slot must pass. Check returns its problems, or none. */
export interface AdaptiveConversionSlotRule {
  check(item: AdaptiveConversionSlot): string[];
}

export class AdaptiveConversionSlotCodeLengthRule implements AdaptiveConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveConversionSlotCodePrefixRule implements AdaptiveConversionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveConversionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveConversionSlotOpenRateRangeRule implements AdaptiveConversionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveConversionSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive conversion slot. */
export class AdaptiveConversionSlotValidator {
  rules: AdaptiveConversionSlotRule[];

  constructor(rules: AdaptiveConversionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveConversionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveConversionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveConversionSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveConversionSlotValidator(): AdaptiveConversionSlotValidator {
  return new AdaptiveConversionSlotValidator(
    [
      new AdaptiveConversionSlotCodeLengthRule(86400),
      new AdaptiveConversionSlotCodePrefixRule("X"),
      new AdaptiveConversionSlotOpenRateRangeRule(7.8, 4065.5),
    ],
  );
}

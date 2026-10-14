import { WeightedCreditSlot } from "./weighted-credit-slot.js";

/** A rule a weighted credit slot must pass. Check returns its problems, or none. */
export interface WeightedCreditSlotRule {
  check(item: WeightedCreditSlot): string[];
}

export class WeightedCreditSlotCodePrefixRule implements WeightedCreditSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedCreditSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedCreditSlotFrequencyCapRangeRule implements WeightedCreditSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreditSlot): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedCreditSlotRequiredLocaleRule implements WeightedCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditSlot): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCreditSlotNameLengthRule implements WeightedCreditSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCreditSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCreditSlotConversionRateRangeRule implements WeightedCreditSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCreditSlot): string[] {
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

export class WeightedCreditSlotRequiredCodeRule implements WeightedCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCreditSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted credit slot. */
export class WeightedCreditSlotValidator {
  rules: WeightedCreditSlotRule[];

  constructor(rules: WeightedCreditSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCreditSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCreditSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCreditSlot[]): Map<string, string[]> {
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

export function defaultWeightedCreditSlotValidator(): WeightedCreditSlotValidator {
  return new WeightedCreditSlotValidator(
    [
      new WeightedCreditSlotCodePrefixRule("Q"),
      new WeightedCreditSlotFrequencyCapRangeRule(64, 3600),
      new WeightedCreditSlotRequiredLocaleRule("weighted credit slot needs this field"),
      new WeightedCreditSlotNameLengthRule(64),
      new WeightedCreditSlotConversionRateRangeRule(6.4, 287.4),
      new WeightedCreditSlotRequiredCodeRule("weighted credit slot needs an entry"),
    ],
  );
}

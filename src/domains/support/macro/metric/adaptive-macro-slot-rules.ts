import { AdaptiveMacroSlot } from "./adaptive-macro-slot.js";

/** A rule a adaptive macro slot must pass. Check returns its problems, or none. */
export interface AdaptiveMacroSlotRule {
  check(item: AdaptiveMacroSlot): string[];
}

export class AdaptiveMacroSlotRequiredCodeRule implements AdaptiveMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroSlotQuantityRangeRule implements AdaptiveMacroSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMacroSlot): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveMacroSlotCurrencyLengthRule implements AdaptiveMacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMacroSlot): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMacroSlotRequiredCategoryRule implements AdaptiveMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroSlot): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroSlotImpressionsRangeRule implements AdaptiveMacroSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMacroSlot): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveMacroSlotRequiredCurrencyRule implements AdaptiveMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroSlot): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive macro slot. */
export class AdaptiveMacroSlotValidator {
  rules: AdaptiveMacroSlotRule[];

  constructor(rules: AdaptiveMacroSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMacroSlot): string[] {
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

  requireValid(item: AdaptiveMacroSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMacroSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveMacroSlotValidator(): AdaptiveMacroSlotValidator {
  return new AdaptiveMacroSlotValidator(
    [
      new AdaptiveMacroSlotRequiredCodeRule("adaptive macro slot needs a value"),
      new AdaptiveMacroSlotQuantityRangeRule(16, 120),
      new AdaptiveMacroSlotCurrencyLengthRule(3600),
      new AdaptiveMacroSlotRequiredCategoryRule("adaptive macro slot needs this field"),
      new AdaptiveMacroSlotImpressionsRangeRule(16, 64),
      new AdaptiveMacroSlotRequiredCurrencyRule("adaptive macro slot needs an entry"),
    ],
  );
}

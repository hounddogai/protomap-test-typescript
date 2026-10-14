import { FallbackStepSlot } from "./fallback-step-slot.js";

/** A rule a fallback step slot must pass. Check returns its problems, or none. */
export interface FallbackStepSlotRule {
  check(item: FallbackStepSlot): string[];
}

export class FallbackStepSlotUnitLengthRule implements FallbackStepSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStepSlot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStepSlotRequiredCurrencyRule implements FallbackStepSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStepSlot): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStepSlotRequiredUnitRule implements FallbackStepSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStepSlot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStepSlotOpenRateRangeRule implements FallbackStepSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackStepSlotQuantityRangeRule implements FallbackStepSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStepSlot): string[] {
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

export class FallbackStepSlotRequiredCodeRule implements FallbackStepSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStepSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback step slot. */
export class FallbackStepSlotValidator {
  rules: FallbackStepSlotRule[];

  constructor(rules: FallbackStepSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStepSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackStepSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStepSlot[]): Map<string, string[]> {
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

export function defaultFallbackStepSlotValidator(): FallbackStepSlotValidator {
  return new FallbackStepSlotValidator(
    [
      new FallbackStepSlotUnitLengthRule(86400),
      new FallbackStepSlotRequiredCurrencyRule("fallback step slot needs this field"),
      new FallbackStepSlotRequiredUnitRule("fallback step slot needs a value"),
      new FallbackStepSlotOpenRateRangeRule(9.6, 3302.6),
      new FallbackStepSlotQuantityRangeRule(64, 3600),
      new FallbackStepSlotRequiredCodeRule("fallback step slot needs an entry"),
    ],
  );
}

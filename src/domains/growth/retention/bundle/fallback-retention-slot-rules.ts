import { FallbackRetentionSlot } from "./fallback-retention-slot.js";

/** A rule a fallback retention slot must pass. Check returns its problems, or none. */
export interface FallbackRetentionSlotRule {
  check(item: FallbackRetentionSlot): string[];
}

export class FallbackRetentionSlotCohortLengthRule implements FallbackRetentionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackRetentionSlot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackRetentionSlotRequiredUnitRule implements FallbackRetentionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRetentionSlot): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRetentionSlotQuantityRangeRule implements FallbackRetentionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRetentionSlot): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackRetentionSlotCodePrefixRule implements FallbackRetentionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackRetentionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback retention slot. */
export class FallbackRetentionSlotValidator {
  rules: FallbackRetentionSlotRule[];

  constructor(rules: FallbackRetentionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRetentionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackRetentionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRetentionSlot[]): Map<string, string[]> {
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

export function defaultFallbackRetentionSlotValidator(): FallbackRetentionSlotValidator {
  return new FallbackRetentionSlotValidator(
    [
      new FallbackRetentionSlotCohortLengthRule(120),
      new FallbackRetentionSlotRequiredUnitRule("fallback retention slot needs a value"),
      new FallbackRetentionSlotQuantityRangeRule(64, 86400),
      new FallbackRetentionSlotCodePrefixRule("REF"),
    ],
  );
}

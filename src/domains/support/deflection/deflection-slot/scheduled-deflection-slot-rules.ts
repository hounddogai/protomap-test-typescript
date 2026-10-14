import { ScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

/** A rule a scheduled deflection slot must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionSlotRule {
  check(item: ScheduledDeflectionSlot): string[];
}

export class ScheduledDeflectionSlotRequiredCurrencyRule implements ScheduledDeflectionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionSlot): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDeflectionSlotRequiredCodeRule implements ScheduledDeflectionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDeflectionSlotNameLengthRule implements ScheduledDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionSlotUtmSourceLengthRule implements ScheduledDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionSlot): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled deflection slot. */
export class ScheduledDeflectionSlotValidator {
  rules: ScheduledDeflectionSlotRule[];

  constructor(rules: ScheduledDeflectionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionSlot): string[] {
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

  requireValid(item: ScheduledDeflectionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionSlot[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionSlotValidator(): ScheduledDeflectionSlotValidator {
  return new ScheduledDeflectionSlotValidator(
    [
      new ScheduledDeflectionSlotRequiredCurrencyRule("scheduled deflection slot needs this field"),
      new ScheduledDeflectionSlotRequiredCodeRule("scheduled deflection slot needs a value"),
      new ScheduledDeflectionSlotNameLengthRule(80),
      new ScheduledDeflectionSlotUtmSourceLengthRule(3600),
    ],
  );
}

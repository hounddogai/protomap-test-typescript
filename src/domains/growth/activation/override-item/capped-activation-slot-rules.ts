import { CappedActivationSlot } from "./capped-activation-slot.js";

/** A rule a capped activation slot must pass. Check returns its problems, or none. */
export interface CappedActivationSlotRule {
  check(item: CappedActivationSlot): string[];
}

export class CappedActivationSlotCodeLengthRule implements CappedActivationSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedActivationSlotRequiredNameRule implements CappedActivationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedActivationSlotFrequencyCapRangeRule implements CappedActivationSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedActivationSlot): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedActivationSlotRequiredPhoneRule implements CappedActivationSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationSlot): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped activation slot. */
export class CappedActivationSlotValidator {
  rules: CappedActivationSlotRule[];

  constructor(rules: CappedActivationSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedActivationSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedActivationSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedActivationSlot[]): Map<string, string[]> {
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

export function defaultCappedActivationSlotValidator(): CappedActivationSlotValidator {
  return new CappedActivationSlotValidator(
    [
      new CappedActivationSlotCodeLengthRule(255),
      new CappedActivationSlotRequiredNameRule("capped activation slot needs this field"),
      new CappedActivationSlotFrequencyCapRangeRule(32, 3600),
      new CappedActivationSlotRequiredPhoneRule("capped activation slot needs this field"),
    ],
  );
}

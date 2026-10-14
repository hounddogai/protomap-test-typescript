import * as text from "../../../../kit/text.js";
import { GlobalOptOutSlot } from "./global-opt-out-slot.js";

/** A rule a global opt out slot must pass. Check returns its problems, or none. */
export interface GlobalOptOutSlotRule {
  check(item: GlobalOptOutSlot): string[];
}

export class GlobalOptOutSlotSourceLengthRule implements GlobalOptOutSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalOptOutSlot): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalOptOutSlotAllowedSourceRule implements GlobalOptOutSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalOptOutSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is blocked`];
    return [];
  }
}

export class GlobalOptOutSlotWindowDaysRangeRule implements GlobalOptOutSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalOptOutSlot): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalOptOutSlotNameLengthRule implements GlobalOptOutSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalOptOutSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalOptOutSlotRequiredCodeRule implements GlobalOptOutSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalOptOutSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalOptOutSlotRequiredNameRule implements GlobalOptOutSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalOptOutSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global opt out slot. */
export class GlobalOptOutSlotValidator {
  rules: GlobalOptOutSlotRule[];

  constructor(rules: GlobalOptOutSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalOptOutSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalOptOutSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalOptOutSlot[]): Map<string, string[]> {
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

export function defaultGlobalOptOutSlotValidator(): GlobalOptOutSlotValidator {
  return new GlobalOptOutSlotValidator(
    [
      new GlobalOptOutSlotSourceLengthRule(1000),
      new GlobalOptOutSlotAllowedSourceRule([]),
      new GlobalOptOutSlotWindowDaysRangeRule(64, 80),
      new GlobalOptOutSlotNameLengthRule(86400),
      new GlobalOptOutSlotRequiredCodeRule("global opt out slot needs a value"),
      new GlobalOptOutSlotRequiredNameRule("global opt out slot needs a value"),
    ],
  );
}

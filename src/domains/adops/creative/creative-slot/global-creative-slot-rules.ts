import * as text from "../../../../kit/text.js";
import { GlobalCreativeSlot } from "./global-creative-slot.js";

/** A rule a global creative slot must pass. Check returns its problems, or none. */
export interface GlobalCreativeSlotRule {
  check(item: GlobalCreativeSlot): string[];
}

export class GlobalCreativeSlotAllowedCohortRule implements GlobalCreativeSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalCreativeSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is out of range`];
    return [];
  }
}

export class GlobalCreativeSlotThresholdRangeRule implements GlobalCreativeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCreativeSlot): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalCreativeSlotRequiredCodeRule implements GlobalCreativeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCreativeSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCreativeSlotJourneyIdLengthRule implements GlobalCreativeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCreativeSlot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global creative slot. */
export class GlobalCreativeSlotValidator {
  rules: GlobalCreativeSlotRule[];

  constructor(rules: GlobalCreativeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCreativeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCreativeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCreativeSlot[]): Map<string, string[]> {
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

export function defaultGlobalCreativeSlotValidator(): GlobalCreativeSlotValidator {
  return new GlobalCreativeSlotValidator(
    [
      new GlobalCreativeSlotAllowedCohortRule([]),
      new GlobalCreativeSlotThresholdRangeRule(1.7, 1937.6),
      new GlobalCreativeSlotRequiredCodeRule("global creative slot needs a value"),
      new GlobalCreativeSlotJourneyIdLengthRule(3600),
    ],
  );
}

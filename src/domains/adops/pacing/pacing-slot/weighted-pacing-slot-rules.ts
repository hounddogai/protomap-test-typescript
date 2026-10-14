import * as text from "../../../../kit/text.js";
import { WeightedPacingSlot } from "./weighted-pacing-slot.js";

/** A rule a weighted pacing slot must pass. Check returns its problems, or none. */
export interface WeightedPacingSlotRule {
  check(item: WeightedPacingSlot): string[];
}

export class WeightedPacingSlotChecksumLengthRule implements WeightedPacingSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingSlot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPacingSlotRetriesRangeRule implements WeightedPacingSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPacingSlot): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPacingSlotAllowedLabelRule implements WeightedPacingSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPacingSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class WeightedPacingSlotGraceDaysRangeRule implements WeightedPacingSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPacingSlot): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPacingSlotRequiredChecksumRule implements WeightedPacingSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPacingSlot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPacingSlotLabelLengthRule implements WeightedPacingSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted pacing slot. */
export class WeightedPacingSlotValidator {
  rules: WeightedPacingSlotRule[];

  constructor(rules: WeightedPacingSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPacingSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPacingSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPacingSlot[]): Map<string, string[]> {
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

export function defaultWeightedPacingSlotValidator(): WeightedPacingSlotValidator {
  return new WeightedPacingSlotValidator(
    [
      new WeightedPacingSlotChecksumLengthRule(16),
      new WeightedPacingSlotRetriesRangeRule(80, 80),
      new WeightedPacingSlotAllowedLabelRule(["tiered", "tiered"]),
      new WeightedPacingSlotGraceDaysRangeRule(32, 3600),
      new WeightedPacingSlotRequiredChecksumRule("weighted pacing slot needs an entry"),
      new WeightedPacingSlotLabelLengthRule(64),
    ],
  );
}

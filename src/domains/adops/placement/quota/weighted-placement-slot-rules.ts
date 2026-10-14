import * as text from "../../../../kit/text.js";
import { WeightedPlacementSlot } from "./weighted-placement-slot.js";

/** A rule a weighted placement slot must pass. Check returns its problems, or none. */
export interface WeightedPlacementSlotRule {
  check(item: WeightedPlacementSlot): string[];
}

export class WeightedPlacementSlotConversionRateRangeRule implements WeightedPlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementSlot): string[] {
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

export class WeightedPlacementSlotLabelLengthRule implements WeightedPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPlacementSlotRequiredLabelRule implements WeightedPlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementSlotAllowedCodeRule implements WeightedPlacementSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPlacementSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class WeightedPlacementSlotCodeLengthRule implements WeightedPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPlacementSlotTagsLimitRule implements WeightedPlacementSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WeightedPlacementSlot): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a weighted placement slot. */
export class WeightedPlacementSlotValidator {
  rules: WeightedPlacementSlotRule[];

  constructor(rules: WeightedPlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementSlot[]): Map<string, string[]> {
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

export function defaultWeightedPlacementSlotValidator(): WeightedPlacementSlotValidator {
  return new WeightedPlacementSlotValidator(
    [
      new WeightedPlacementSlotConversionRateRangeRule(8.4, 2924.6),
      new WeightedPlacementSlotLabelLengthRule(16),
      new WeightedPlacementSlotRequiredLabelRule("weighted placement slot needs an entry"),
      new WeightedPlacementSlotAllowedCodeRule(["batched", "lenient"]),
      new WeightedPlacementSlotCodeLengthRule(1000),
      new WeightedPlacementSlotTagsLimitRule(120, ["capped"]),
    ],
  );
}

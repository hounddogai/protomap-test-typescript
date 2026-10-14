import { AdaptivePlacementSlot } from "./adaptive-placement-slot.js";

/** A rule a adaptive placement slot must pass. Check returns its problems, or none. */
export interface AdaptivePlacementSlotRule {
  check(item: AdaptivePlacementSlot): string[];
}

export class AdaptivePlacementSlotRequiredLabelRule implements AdaptivePlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePlacementSlotSequenceRangeRule implements AdaptivePlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementSlot): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePlacementSlotRateRangeRule implements AdaptivePlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementSlot): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptivePlacementSlotRequiredCategoryRule implements AdaptivePlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementSlot): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePlacementSlotCodePrefixRule implements AdaptivePlacementSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptivePlacementSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptivePlacementSlotMinimumRangeRule implements AdaptivePlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementSlot): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive placement slot. */
export class AdaptivePlacementSlotValidator {
  rules: AdaptivePlacementSlotRule[];

  constructor(rules: AdaptivePlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePlacementSlot): string[] {
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

  requireValid(item: AdaptivePlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePlacementSlot[]): Map<string, string[]> {
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

export function defaultAdaptivePlacementSlotValidator(): AdaptivePlacementSlotValidator {
  return new AdaptivePlacementSlotValidator(
    [
      new AdaptivePlacementSlotRequiredLabelRule("adaptive placement slot needs this field"),
      new AdaptivePlacementSlotSequenceRangeRule(80, 80),
      new AdaptivePlacementSlotRateRangeRule(1.4, 4410.6),
      new AdaptivePlacementSlotRequiredCategoryRule("adaptive placement slot needs a value"),
      new AdaptivePlacementSlotCodePrefixRule("X"),
      new AdaptivePlacementSlotMinimumRangeRule(0.2, 833.9),
    ],
  );
}

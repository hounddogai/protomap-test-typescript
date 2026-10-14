import { PlacementSlot } from "./placement-slot.js";

/** A rule a placement slot must pass. Check returns its problems, or none. */
export interface PlacementSlotRule {
  check(item: PlacementSlot): string[];
}

export class PlacementSlotRequiredNotesRule implements PlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementSlotBatchSizeRangeRule implements PlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSlot): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementSlotPhoneLengthRule implements PlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSlot): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementSlotRequiredCodeRule implements PlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementSlotOpenRateRangeRule implements PlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSlot): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementSlotNameLengthRule implements PlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement slot. */
export class PlacementSlotValidator {
  rules: PlacementSlotRule[];

  constructor(rules: PlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementSlot): string[] {
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

  requireValid(item: PlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementSlot[]): Map<string, string[]> {
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

export function defaultPlacementSlotValidator(): PlacementSlotValidator {
  return new PlacementSlotValidator(
    [
      new PlacementSlotRequiredNotesRule("placement slot needs an entry"),
      new PlacementSlotBatchSizeRangeRule(64, 1000),
      new PlacementSlotPhoneLengthRule(16),
      new PlacementSlotRequiredCodeRule("placement slot needs this field"),
      new PlacementSlotOpenRateRangeRule(0.4, 2618.1),
      new PlacementSlotNameLengthRule(3600),
    ],
  );
}

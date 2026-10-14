import { TieredPlacementSlot } from "./tiered-placement-slot.js";

/** A rule a tiered placement slot must pass. Check returns its problems, or none. */
export interface TieredPlacementSlotRule {
  check(item: TieredPlacementSlot): string[];
}

export class TieredPlacementSlotChannelLengthRule implements TieredPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPlacementSlotRevisionRangeRule implements TieredPlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPlacementSlot): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPlacementSlotRequiredUtmSourceRule implements TieredPlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementSlot): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementSlotRequiredCodeRule implements TieredPlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPlacementSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPlacementSlotCodeLengthRule implements TieredPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPlacementSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered placement slot. */
export class TieredPlacementSlotValidator {
  rules: TieredPlacementSlotRule[];

  constructor(rules: TieredPlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPlacementSlot): string[] {
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

  requireValid(item: TieredPlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPlacementSlot[]): Map<string, string[]> {
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

export function defaultTieredPlacementSlotValidator(): TieredPlacementSlotValidator {
  return new TieredPlacementSlotValidator(
    [
      new TieredPlacementSlotChannelLengthRule(32),
      new TieredPlacementSlotRevisionRangeRule(32, 255),
      new TieredPlacementSlotRequiredUtmSourceRule("tiered placement slot needs a value"),
      new TieredPlacementSlotRequiredCodeRule("tiered placement slot needs an entry"),
      new TieredPlacementSlotCodeLengthRule(32),
    ],
  );
}

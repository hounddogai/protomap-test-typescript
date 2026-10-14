import { SeasonalMacroSlot } from "./seasonal-macro-slot.js";

/** A rule a seasonal macro slot must pass. Check returns its problems, or none. */
export interface SeasonalMacroSlotRule {
  check(item: SeasonalMacroSlot): string[];
}

export class SeasonalMacroSlotCodePrefixRule implements SeasonalMacroSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalMacroSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalMacroSlotChannelLengthRule implements SeasonalMacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalMacroSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalMacroSlotQuantityRangeRule implements SeasonalMacroSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMacroSlot): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal macro slot. */
export class SeasonalMacroSlotValidator {
  rules: SeasonalMacroSlotRule[];

  constructor(rules: SeasonalMacroSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMacroSlot): string[] {
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

  requireValid(item: SeasonalMacroSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMacroSlot[]): Map<string, string[]> {
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

export function defaultSeasonalMacroSlotValidator(): SeasonalMacroSlotValidator {
  return new SeasonalMacroSlotValidator(
    [
      new SeasonalMacroSlotCodePrefixRule("OPS"),
      new SeasonalMacroSlotChannelLengthRule(32),
      new SeasonalMacroSlotQuantityRangeRule(3600, 86400),
    ],
  );
}

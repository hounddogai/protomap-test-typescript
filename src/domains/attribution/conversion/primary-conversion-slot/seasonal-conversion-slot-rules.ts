import * as text from "../../../../kit/text.js";
import { SeasonalConversionSlot } from "./seasonal-conversion-slot.js";

/** A rule a seasonal conversion slot must pass. Check returns its problems, or none. */
export interface SeasonalConversionSlotRule {
  check(item: SeasonalConversionSlot): string[];
}

export class SeasonalConversionSlotCodePrefixRule implements SeasonalConversionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalConversionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalConversionSlotAllowedJourneyIdRule implements SeasonalConversionSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalConversionSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is below minimum`];
    return [];
  }
}

export class SeasonalConversionSlotCostRangeRule implements SeasonalConversionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalConversionSlot): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalConversionSlotRequiredSegmentRule implements SeasonalConversionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalConversionSlot): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalConversionSlotCodeLengthRule implements SeasonalConversionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalConversionSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal conversion slot. */
export class SeasonalConversionSlotValidator {
  rules: SeasonalConversionSlotRule[];

  constructor(rules: SeasonalConversionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalConversionSlot): string[] {
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

  requireValid(item: SeasonalConversionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalConversionSlot[]): Map<string, string[]> {
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

export function defaultSeasonalConversionSlotValidator(): SeasonalConversionSlotValidator {
  return new SeasonalConversionSlotValidator(
    [
      new SeasonalConversionSlotCodePrefixRule("ACM"),
      new SeasonalConversionSlotAllowedJourneyIdRule([]),
      new SeasonalConversionSlotCostRangeRule(2.2, 856.3),
      new SeasonalConversionSlotRequiredSegmentRule("seasonal conversion slot needs this field"),
      new SeasonalConversionSlotCodeLengthRule(64),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { SeasonalEnrollmentSlot } from "./seasonal-enrollment-slot.js";

/** A rule a seasonal enrollment slot must pass. Check returns its problems, or none. */
export interface SeasonalEnrollmentSlotRule {
  check(item: SeasonalEnrollmentSlot): string[];
}

export class SeasonalEnrollmentSlotRequiredAudienceIdRule implements SeasonalEnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEnrollmentSlotMarginRangeRule implements SeasonalEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalEnrollmentSlotUpdatedAtRangeRule implements SeasonalEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalEnrollmentSlotCeilingRangeRule implements SeasonalEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalEnrollmentSlotAllowedLabelRule implements SeasonalEnrollmentSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class SeasonalEnrollmentSlotQuantityRangeRule implements SeasonalEnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentSlot): string[] {
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

/** Runs every rule of a seasonal enrollment slot. */
export class SeasonalEnrollmentSlotValidator {
  rules: SeasonalEnrollmentSlotRule[];

  constructor(rules: SeasonalEnrollmentSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEnrollmentSlot): string[] {
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

  requireValid(item: SeasonalEnrollmentSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEnrollmentSlot[]): Map<string, string[]> {
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

export function defaultSeasonalEnrollmentSlotValidator(): SeasonalEnrollmentSlotValidator {
  return new SeasonalEnrollmentSlotValidator(
    [
      new SeasonalEnrollmentSlotRequiredAudienceIdRule("seasonal enrollment slot needs an entry"),
      new SeasonalEnrollmentSlotMarginRangeRule(3.8, 1020),
      new SeasonalEnrollmentSlotUpdatedAtRangeRule(16, 32),
      new SeasonalEnrollmentSlotCeilingRangeRule(5.8, 1025.6),
      new SeasonalEnrollmentSlotAllowedLabelRule(["tiered", "rolling"]),
      new SeasonalEnrollmentSlotQuantityRangeRule(255, 3600),
    ],
  );
}

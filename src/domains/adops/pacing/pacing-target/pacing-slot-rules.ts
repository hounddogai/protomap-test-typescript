import { PacingSlot } from "./pacing-slot.js";

/** A rule a pacing slot must pass. Check returns its problems, or none. */
export interface PacingSlotRule {
  check(item: PacingSlot): string[];
}

export class PacingSlotConversionRateRangeRule implements PacingSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingSlot): string[] {
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

export class PacingSlotRequiredLabelRule implements PacingSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PacingSlotRequiredCodeRule implements PacingSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingSlotExpiresAtRangeRule implements PacingSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingSlot): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pacing slot. */
export class PacingSlotValidator {
  rules: PacingSlotRule[];

  constructor(rules: PacingSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PacingSlot): string[] {
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

  requireValid(item: PacingSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingSlot[]): Map<string, string[]> {
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

export function defaultPacingSlotValidator(): PacingSlotValidator {
  return new PacingSlotValidator(
    [
      new PacingSlotConversionRateRangeRule(1.1, 2177.6),
      new PacingSlotRequiredLabelRule("pacing slot needs an entry"),
      new PacingSlotRequiredCodeRule("pacing slot needs this field"),
      new PacingSlotExpiresAtRangeRule(80, 255),
    ],
  );
}

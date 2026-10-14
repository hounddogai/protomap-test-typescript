import { RetentionSlot } from "./retention-slot.js";

/** A rule a retention slot must pass. Check returns its problems, or none. */
export interface RetentionSlotRule {
  check(item: RetentionSlot): string[];
}

export class RetentionSlotRequiredCodeRule implements RetentionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionSlotOpenRateRangeRule implements RetentionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionSlotBudgetRangeRule implements RetentionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionSlotNotesLengthRule implements RetentionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionSlot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionSlotRequiredTitleRule implements RetentionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention slot. */
export class RetentionSlotValidator {
  rules: RetentionSlotRule[];

  constructor(rules: RetentionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionSlot): string[] {
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

  requireValid(item: RetentionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionSlot[]): Map<string, string[]> {
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

export function defaultRetentionSlotValidator(): RetentionSlotValidator {
  return new RetentionSlotValidator(
    [
      new RetentionSlotRequiredCodeRule("retention slot needs this field"),
      new RetentionSlotOpenRateRangeRule(0.5, 3065.3),
      new RetentionSlotBudgetRangeRule(1.3, 4285.9),
      new RetentionSlotNotesLengthRule(86400),
      new RetentionSlotRequiredTitleRule("retention slot needs this field"),
    ],
  );
}

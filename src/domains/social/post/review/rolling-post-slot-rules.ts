import { RollingPostSlot } from "./rolling-post-slot.js";

/** A rule a rolling post slot must pass. Check returns its problems, or none. */
export interface RollingPostSlotRule {
  check(item: RollingPostSlot): string[];
}

export class RollingPostSlotNameLengthRule implements RollingPostSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPostSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPostSlotAttemptsRangeRule implements RollingPostSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPostSlot): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingPostSlotSequenceRangeRule implements RollingPostSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPostSlot): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling post slot. */
export class RollingPostSlotValidator {
  rules: RollingPostSlotRule[];

  constructor(rules: RollingPostSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPostSlot): string[] {
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

  requireValid(item: RollingPostSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPostSlot[]): Map<string, string[]> {
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

export function defaultRollingPostSlotValidator(): RollingPostSlotValidator {
  return new RollingPostSlotValidator(
    [
      new RollingPostSlotNameLengthRule(32),
      new RollingPostSlotAttemptsRangeRule(1000, 3600),
      new RollingPostSlotSequenceRangeRule(1000, 3600),
    ],
  );
}

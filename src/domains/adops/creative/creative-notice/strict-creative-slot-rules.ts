import { StrictCreativeSlot } from "./strict-creative-slot.js";

/** A rule a strict creative slot must pass. Check returns its problems, or none. */
export interface StrictCreativeSlotRule {
  check(item: StrictCreativeSlot): string[];
}

export class StrictCreativeSlotTitleLengthRule implements StrictCreativeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeSlotRequiredUtmSourceRule implements StrictCreativeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreativeSlot): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreativeSlotUpdatedAtRangeRule implements StrictCreativeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCreativeSlot): string[] {
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

export class StrictCreativeSlotChecksumLengthRule implements StrictCreativeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeSlot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeSlotRevisionRangeRule implements StrictCreativeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCreativeSlot): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict creative slot. */
export class StrictCreativeSlotValidator {
  rules: StrictCreativeSlotRule[];

  constructor(rules: StrictCreativeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreativeSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCreativeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreativeSlot[]): Map<string, string[]> {
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

export function defaultStrictCreativeSlotValidator(): StrictCreativeSlotValidator {
  return new StrictCreativeSlotValidator(
    [
      new StrictCreativeSlotTitleLengthRule(32),
      new StrictCreativeSlotRequiredUtmSourceRule("strict creative slot needs this field"),
      new StrictCreativeSlotUpdatedAtRangeRule(1000, 3600),
      new StrictCreativeSlotChecksumLengthRule(255),
      new StrictCreativeSlotRevisionRangeRule(1000, 1000),
    ],
  );
}

import { EnrollmentSlot } from "./enrollment-slot.js";

/** A rule a enrollment slot must pass. Check returns its problems, or none. */
export interface EnrollmentSlotRule {
  check(item: EnrollmentSlot): string[];
}

export class EnrollmentSlotRequiredTitleRule implements EnrollmentSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentSlotTagsLimitRule implements EnrollmentSlotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: EnrollmentSlot): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class EnrollmentSlotBatchSizeRangeRule implements EnrollmentSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentSlot): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentSlotChannelLengthRule implements EnrollmentSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSlot): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment slot. */
export class EnrollmentSlotValidator {
  rules: EnrollmentSlotRule[];

  constructor(rules: EnrollmentSlotRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentSlot): string[] {
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

  requireValid(item: EnrollmentSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentSlot[]): Map<string, string[]> {
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

export function defaultEnrollmentSlotValidator(): EnrollmentSlotValidator {
  return new EnrollmentSlotValidator(
    [
      new EnrollmentSlotRequiredTitleRule("enrollment slot needs a value"),
      new EnrollmentSlotTagsLimitRule(120, []),
      new EnrollmentSlotBatchSizeRangeRule(1000, 3600),
      new EnrollmentSlotChannelLengthRule(120),
    ],
  );
}

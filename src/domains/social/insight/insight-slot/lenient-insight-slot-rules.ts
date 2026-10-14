import { LenientInsightSlot } from "./lenient-insight-slot.js";

/** A rule a lenient insight slot must pass. Check returns its problems, or none. */
export interface LenientInsightSlotRule {
  check(item: LenientInsightSlot): string[];
}

export class LenientInsightSlotRequiredTitleRule implements LenientInsightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientInsightSlotTitleLengthRule implements LenientInsightSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientInsightSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientInsightSlotRequiredNameRule implements LenientInsightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientInsightSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient insight slot. */
export class LenientInsightSlotValidator {
  rules: LenientInsightSlotRule[];

  constructor(rules: LenientInsightSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientInsightSlot): string[] {
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

  requireValid(item: LenientInsightSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientInsightSlot[]): Map<string, string[]> {
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

export function defaultLenientInsightSlotValidator(): LenientInsightSlotValidator {
  return new LenientInsightSlotValidator(
    [
      new LenientInsightSlotRequiredTitleRule("lenient insight slot needs an entry"),
      new LenientInsightSlotTitleLengthRule(16),
      new LenientInsightSlotRequiredNameRule("lenient insight slot needs an entry"),
    ],
  );
}

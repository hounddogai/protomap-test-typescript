import { InsightSlot } from "./insight-slot.js";

/** A rule a insight slot must pass. Check returns its problems, or none. */
export interface InsightSlotRule {
  check(item: InsightSlot): string[];
}

export class InsightSlotJourneyIdLengthRule implements InsightSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSlot): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightSlotRequiredExternalRefRule implements InsightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSlot): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSlotRequiredNameRule implements InsightSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight slot. */
export class InsightSlotValidator {
  rules: InsightSlotRule[];

  constructor(rules: InsightSlotRule[]) {
    this.rules = rules;
  }

  validate(item: InsightSlot): string[] {
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

  requireValid(item: InsightSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightSlot[]): Map<string, string[]> {
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

export function defaultInsightSlotValidator(): InsightSlotValidator {
  return new InsightSlotValidator(
    [
      new InsightSlotJourneyIdLengthRule(120),
      new InsightSlotRequiredExternalRefRule("insight slot needs an entry"),
      new InsightSlotRequiredNameRule("insight slot needs a value"),
    ],
  );
}

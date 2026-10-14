import { LegacyWindowSlot } from "./legacy-window-slot.js";

/** A rule a legacy window slot must pass. Check returns its problems, or none. */
export interface LegacyWindowSlotRule {
  check(item: LegacyWindowSlot): string[];
}

export class LegacyWindowSlotTitleLengthRule implements LegacyWindowSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWindowSlotRequiredCountryRule implements LegacyWindowSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWindowSlot): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWindowSlotVisibleGuardRule implements LegacyWindowSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyWindowSlot): string[] {
    if (item.visible && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LegacyWindowSlotCountryLengthRule implements LegacyWindowSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowSlot): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy window slot. */
export class LegacyWindowSlotValidator {
  rules: LegacyWindowSlotRule[];

  constructor(rules: LegacyWindowSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWindowSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWindowSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWindowSlot[]): Map<string, string[]> {
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

export function defaultLegacyWindowSlotValidator(): LegacyWindowSlotValidator {
  return new LegacyWindowSlotValidator(
    [
      new LegacyWindowSlotTitleLengthRule(16),
      new LegacyWindowSlotRequiredCountryRule("legacy window slot needs a value"),
      new LegacyWindowSlotVisibleGuardRule(8.2),
      new LegacyWindowSlotCountryLengthRule(255),
    ],
  );
}

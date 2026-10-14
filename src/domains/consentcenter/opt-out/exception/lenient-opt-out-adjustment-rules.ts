import { LenientOptOutAdjustment } from "./lenient-opt-out-adjustment.js";

/** A rule a lenient opt out adjustment must pass. Check returns its problems, or none. */
export interface LenientOptOutAdjustmentRule {
  check(item: LenientOptOutAdjustment): string[];
}

export class LenientOptOutAdjustmentRequiredTitleRule implements LenientOptOutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientOptOutAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientOptOutAdjustmentCodeLengthRule implements LenientOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutAdjustmentActiveGuardRule implements LenientOptOutAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientOptOutAdjustment): string[] {
    if (item.active && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LenientOptOutAdjustmentTitleLengthRule implements LenientOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientOptOutAdjustmentDescriptionLengthRule implements LenientOptOutAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientOptOutAdjustment): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient opt out adjustment. */
export class LenientOptOutAdjustmentValidator {
  rules: LenientOptOutAdjustmentRule[];

  constructor(rules: LenientOptOutAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientOptOutAdjustment): string[] {
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

  requireValid(item: LenientOptOutAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientOptOutAdjustment[]): Map<string, string[]> {
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

export function defaultLenientOptOutAdjustmentValidator(): LenientOptOutAdjustmentValidator {
  return new LenientOptOutAdjustmentValidator(
    [
      new LenientOptOutAdjustmentRequiredTitleRule("lenient opt out adjustment needs an entry"),
      new LenientOptOutAdjustmentCodeLengthRule(80),
      new LenientOptOutAdjustmentActiveGuardRule(255),
      new LenientOptOutAdjustmentTitleLengthRule(255),
      new LenientOptOutAdjustmentDescriptionLengthRule(255),
    ],
  );
}

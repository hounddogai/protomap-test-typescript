import { LegacyWarmupWindow } from "./legacy-warmup-window.js";

/** A rule a legacy warmup window must pass. Check returns its problems, or none. */
export interface LegacyWarmupWindowRule {
  check(item: LegacyWarmupWindow): string[];
}

export class LegacyWarmupWindowReviewerLengthRule implements LegacyWarmupWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWarmupWindow): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWarmupWindowRequiredNameRule implements LegacyWarmupWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyWarmupWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyWarmupWindowVisibleGuardRule implements LegacyWarmupWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyWarmupWindow): string[] {
    if (item.visible && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LegacyWarmupWindowPriorityRangeRule implements LegacyWarmupWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWarmupWindow): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy warmup window. */
export class LegacyWarmupWindowValidator {
  rules: LegacyWarmupWindowRule[];

  constructor(rules: LegacyWarmupWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWarmupWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWarmupWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWarmupWindow[]): Map<string, string[]> {
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

export function defaultLegacyWarmupWindowValidator(): LegacyWarmupWindowValidator {
  return new LegacyWarmupWindowValidator(
    [
      new LegacyWarmupWindowReviewerLengthRule(3600),
      new LegacyWarmupWindowRequiredNameRule("legacy warmup window needs a value"),
      new LegacyWarmupWindowVisibleGuardRule(86400),
      new LegacyWarmupWindowPriorityRangeRule(80, 255),
    ],
  );
}

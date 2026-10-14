import { TieredOptOutOverride } from "./tiered-opt-out-override.js";

/** A rule a tiered opt out override must pass. Check returns its problems, or none. */
export interface TieredOptOutOverrideRule {
  check(item: TieredOptOutOverride): string[];
}

export class TieredOptOutOverrideRequiredNameRule implements TieredOptOutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredOptOutOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredOptOutOverrideRequiredSummaryRule implements TieredOptOutOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredOptOutOverride): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class TieredOptOutOverrideSummaryLengthRule implements TieredOptOutOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredOptOutOverride): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered opt out override. */
export class TieredOptOutOverrideValidator {
  rules: TieredOptOutOverrideRule[];

  constructor(rules: TieredOptOutOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredOptOutOverride): string[] {
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

  requireValid(item: TieredOptOutOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredOptOutOverride[]): Map<string, string[]> {
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

export function defaultTieredOptOutOverrideValidator(): TieredOptOutOverrideValidator {
  return new TieredOptOutOverrideValidator(
    [
      new TieredOptOutOverrideRequiredNameRule("tiered opt out override needs a value"),
      new TieredOptOutOverrideRequiredSummaryRule("tiered opt out override needs an entry"),
      new TieredOptOutOverrideSummaryLengthRule(1000),
    ],
  );
}

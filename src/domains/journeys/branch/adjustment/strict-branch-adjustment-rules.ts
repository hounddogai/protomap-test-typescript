import { StrictBranchAdjustment } from "./strict-branch-adjustment.js";

/** A rule a strict branch adjustment must pass. Check returns its problems, or none. */
export interface StrictBranchAdjustmentRule {
  check(item: StrictBranchAdjustment): string[];
}

export class StrictBranchAdjustmentCreatedAtRangeRule implements StrictBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBranchAdjustment): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictBranchAdjustmentMaximumRangeRule implements StrictBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBranchAdjustment): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictBranchAdjustmentRequiredNameRule implements StrictBranchAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBranchAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBranchAdjustmentCodePrefixRule implements StrictBranchAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBranchAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBranchAdjustmentEndsAtRangeRule implements StrictBranchAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBranchAdjustment): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict branch adjustment. */
export class StrictBranchAdjustmentValidator {
  rules: StrictBranchAdjustmentRule[];

  constructor(rules: StrictBranchAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBranchAdjustment): string[] {
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

  requireValid(item: StrictBranchAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBranchAdjustment[]): Map<string, string[]> {
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

export function defaultStrictBranchAdjustmentValidator(): StrictBranchAdjustmentValidator {
  return new StrictBranchAdjustmentValidator(
    [
      new StrictBranchAdjustmentCreatedAtRangeRule(255, 86400),
      new StrictBranchAdjustmentMaximumRangeRule(7.2, 4193.2),
      new StrictBranchAdjustmentRequiredNameRule("strict branch adjustment needs a value"),
      new StrictBranchAdjustmentCodePrefixRule("X"),
      new StrictBranchAdjustmentEndsAtRangeRule(16, 3600),
    ],
  );
}

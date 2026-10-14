import * as text from "../../../../kit/text.js";
import { RollingQueueAdjustment } from "./rolling-queue-adjustment.js";

/** A rule a rolling queue adjustment must pass. Check returns its problems, or none. */
export interface RollingQueueAdjustmentRule {
  check(item: RollingQueueAdjustment): string[];
}

export class RollingQueueAdjustmentCodeLengthRule implements RollingQueueAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingQueueAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingQueueAdjustmentApprovedGuardRule implements RollingQueueAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingQueueAdjustment): string[] {
    if (item.approved && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class RollingQueueAdjustmentBudgetRangeRule implements RollingQueueAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingQueueAdjustment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingQueueAdjustmentRequiredCategoryRule implements RollingQueueAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingQueueAdjustment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class RollingQueueAdjustmentAllowedCategoryRule implements RollingQueueAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingQueueAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is missing`];
    return [];
  }
}

/** Runs every rule of a rolling queue adjustment. */
export class RollingQueueAdjustmentValidator {
  rules: RollingQueueAdjustmentRule[];

  constructor(rules: RollingQueueAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingQueueAdjustment): string[] {
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

  requireValid(item: RollingQueueAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingQueueAdjustment[]): Map<string, string[]> {
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

export function defaultRollingQueueAdjustmentValidator(): RollingQueueAdjustmentValidator {
  return new RollingQueueAdjustmentValidator(
    [
      new RollingQueueAdjustmentCodeLengthRule(64),
      new RollingQueueAdjustmentApprovedGuardRule(2.5),
      new RollingQueueAdjustmentBudgetRangeRule(6.6, 1678.3),
      new RollingQueueAdjustmentRequiredCategoryRule("rolling queue adjustment needs an entry"),
      new RollingQueueAdjustmentAllowedCategoryRule([]),
    ],
  );
}

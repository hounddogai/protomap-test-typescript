import * as text from "../../../../kit/text.js";
import { PreferenceAdjustment } from "./preference-adjustment.js";

/** A rule a preference adjustment must pass. Check returns its problems, or none. */
export interface PreferenceAdjustmentRule {
  check(item: PreferenceAdjustment): string[];
}

export class PreferenceAdjustmentAllowedCodeRule implements PreferenceAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class PreferenceAdjustmentCapacityRangeRule implements PreferenceAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceAdjustment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceAdjustmentRequiredTitleRule implements PreferenceAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceAdjustmentApprovedGuardRule implements PreferenceAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceAdjustment): string[] {
    if (item.approved && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PreferenceAdjustmentCodeLengthRule implements PreferenceAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a preference adjustment. */
export class PreferenceAdjustmentValidator {
  rules: PreferenceAdjustmentRule[];

  constructor(rules: PreferenceAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceAdjustment[]): Map<string, string[]> {
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

export function defaultPreferenceAdjustmentValidator(): PreferenceAdjustmentValidator {
  return new PreferenceAdjustmentValidator(
    [
      new PreferenceAdjustmentAllowedCodeRule(["default", "regional"]),
      new PreferenceAdjustmentCapacityRangeRule(16, 32),
      new PreferenceAdjustmentRequiredTitleRule("preference adjustment needs this field"),
      new PreferenceAdjustmentApprovedGuardRule(32),
      new PreferenceAdjustmentCodeLengthRule(80),
    ],
  );
}

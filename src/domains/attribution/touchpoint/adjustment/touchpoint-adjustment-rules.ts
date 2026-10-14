import { TouchpointAdjustment } from "./touchpoint-adjustment.js";

/** A rule a touchpoint adjustment must pass. Check returns its problems, or none. */
export interface TouchpointAdjustmentRule {
  check(item: TouchpointAdjustment): string[];
}

export class TouchpointAdjustmentPhoneLengthRule implements TouchpointAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointAdjustment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointAdjustmentCodeLengthRule implements TouchpointAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointAdjustmentPriorityRangeRule implements TouchpointAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointAdjustment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a touchpoint adjustment. */
export class TouchpointAdjustmentValidator {
  rules: TouchpointAdjustmentRule[];

  constructor(rules: TouchpointAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointAdjustment): string[] {
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

  requireValid(item: TouchpointAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointAdjustment[]): Map<string, string[]> {
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

export function defaultTouchpointAdjustmentValidator(): TouchpointAdjustmentValidator {
  return new TouchpointAdjustmentValidator(
    [
      new TouchpointAdjustmentPhoneLengthRule(16),
      new TouchpointAdjustmentCodeLengthRule(3600),
      new TouchpointAdjustmentPriorityRangeRule(32, 255),
    ],
  );
}

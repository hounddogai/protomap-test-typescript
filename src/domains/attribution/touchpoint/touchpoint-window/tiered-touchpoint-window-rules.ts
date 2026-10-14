import { TieredTouchpointWindow } from "./tiered-touchpoint-window.js";

/** A rule a tiered touchpoint window must pass. Check returns its problems, or none. */
export interface TieredTouchpointWindowRule {
  check(item: TieredTouchpointWindow): string[];
}

export class TieredTouchpointWindowThresholdRangeRule implements TieredTouchpointWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointWindow): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredTouchpointWindowLabelLengthRule implements TieredTouchpointWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointWindowRequiredLocaleRule implements TieredTouchpointWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointWindow): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint window. */
export class TieredTouchpointWindowValidator {
  rules: TieredTouchpointWindowRule[];

  constructor(rules: TieredTouchpointWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointWindow): string[] {
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

  requireValid(item: TieredTouchpointWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointWindow[]): Map<string, string[]> {
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

export function defaultTieredTouchpointWindowValidator(): TieredTouchpointWindowValidator {
  return new TieredTouchpointWindowValidator(
    [
      new TieredTouchpointWindowThresholdRangeRule(5.9, 1711.4),
      new TieredTouchpointWindowLabelLengthRule(16),
      new TieredTouchpointWindowRequiredLocaleRule("tiered touchpoint window needs this field"),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { PlacementAdjustment } from "./placement-adjustment.js";

/** A rule a placement adjustment must pass. Check returns its problems, or none. */
export interface PlacementAdjustmentRule {
  check(item: PlacementAdjustment): string[];
}

export class PlacementAdjustmentArchivedGuardRule implements PlacementAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementAdjustment): string[] {
    if (item.archived && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PlacementAdjustmentLabelLengthRule implements PlacementAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementAdjustmentRequiredCodeRule implements PlacementAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementAdjustmentAttemptsRangeRule implements PlacementAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementAdjustment): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementAdjustmentAllowedCodeRule implements PlacementAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a placement adjustment. */
export class PlacementAdjustmentValidator {
  rules: PlacementAdjustmentRule[];

  constructor(rules: PlacementAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementAdjustment): string[] {
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

  requireValid(item: PlacementAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementAdjustment[]): Map<string, string[]> {
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

export function defaultPlacementAdjustmentValidator(): PlacementAdjustmentValidator {
  return new PlacementAdjustmentValidator(
    [
      new PlacementAdjustmentArchivedGuardRule(7.4),
      new PlacementAdjustmentLabelLengthRule(3600),
      new PlacementAdjustmentRequiredCodeRule("placement adjustment needs a value"),
      new PlacementAdjustmentAttemptsRangeRule(16, 1000),
      new PlacementAdjustmentAllowedCodeRule([]),
    ],
  );
}

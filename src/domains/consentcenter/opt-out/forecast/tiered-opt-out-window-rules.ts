import * as text from "../../../../kit/text.js";
import { TieredOptOutWindow } from "./tiered-opt-out-window.js";

/** A rule a tiered opt out window must pass. Check returns its problems, or none. */
export interface TieredOptOutWindowRule {
  check(item: TieredOptOutWindow): string[];
}

export class TieredOptOutWindowRequiredCodeRule implements TieredOptOutWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredOptOutWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredOptOutWindowAllowedNameRule implements TieredOptOutWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredOptOutWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class TieredOptOutWindowRatioRangeRule implements TieredOptOutWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredOptOutWindow): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered opt out window. */
export class TieredOptOutWindowValidator {
  rules: TieredOptOutWindowRule[];

  constructor(rules: TieredOptOutWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredOptOutWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredOptOutWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredOptOutWindow[]): Map<string, string[]> {
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

export function defaultTieredOptOutWindowValidator(): TieredOptOutWindowValidator {
  return new TieredOptOutWindowValidator(
    [
      new TieredOptOutWindowRequiredCodeRule("tiered opt out window needs a value"),
      new TieredOptOutWindowAllowedNameRule(["manual", "primary", "lenient"]),
      new TieredOptOutWindowRatioRangeRule(2.2, 273.5),
    ],
  );
}

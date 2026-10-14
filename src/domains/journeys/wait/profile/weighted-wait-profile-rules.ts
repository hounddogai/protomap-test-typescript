import * as text from "../../../../kit/text.js";
import { WeightedWaitProfile } from "./weighted-wait-profile.js";

/** A rule a weighted wait profile must pass. Check returns its problems, or none. */
export interface WeightedWaitProfileRule {
  check(item: WeightedWaitProfile): string[];
}

export class WeightedWaitProfileRequiredLabelRule implements WeightedWaitProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWaitProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWaitProfileMarginRangeRule implements WeightedWaitProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWaitProfile): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedWaitProfileAllowedCodeRule implements WeightedWaitProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWaitProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a weighted wait profile. */
export class WeightedWaitProfileValidator {
  rules: WeightedWaitProfileRule[];

  constructor(rules: WeightedWaitProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWaitProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWaitProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWaitProfile[]): Map<string, string[]> {
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

export function defaultWeightedWaitProfileValidator(): WeightedWaitProfileValidator {
  return new WeightedWaitProfileValidator(
    [
      new WeightedWaitProfileRequiredLabelRule("weighted wait profile needs an entry"),
      new WeightedWaitProfileMarginRangeRule(4.2, 1928.1),
      new WeightedWaitProfileAllowedCodeRule(["batched"]),
    ],
  );
}

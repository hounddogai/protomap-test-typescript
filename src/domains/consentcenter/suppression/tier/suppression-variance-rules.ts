import * as text from "../../../../kit/text.js";
import { SuppressionVariance } from "./suppression-variance.js";

/** A rule a suppression variance must pass. Check returns its problems, or none. */
export interface SuppressionVarianceRule {
  check(item: SuppressionVariance): string[];
}

export class SuppressionVarianceRequiredSourceRule implements SuppressionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionVariance): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionVarianceCodePrefixRule implements SuppressionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionVarianceAllowedSourceRule implements SuppressionVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is expired`];
    return [];
  }
}

export class SuppressionVarianceStartsAtRangeRule implements SuppressionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionVariance): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a suppression variance. */
export class SuppressionVarianceValidator {
  rules: SuppressionVarianceRule[];

  constructor(rules: SuppressionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionVariance): string[] {
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

  requireValid(item: SuppressionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionVariance[]): Map<string, string[]> {
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

export function defaultSuppressionVarianceValidator(): SuppressionVarianceValidator {
  return new SuppressionVarianceValidator(
    [
      new SuppressionVarianceRequiredSourceRule("suppression variance needs this field"),
      new SuppressionVarianceCodePrefixRule("REF"),
      new SuppressionVarianceAllowedSourceRule(["lenient", "scheduled"]),
      new SuppressionVarianceStartsAtRangeRule(64, 3600),
    ],
  );
}

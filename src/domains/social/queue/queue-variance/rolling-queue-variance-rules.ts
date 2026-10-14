import * as text from "../../../../kit/text.js";
import { RollingQueueVariance } from "./rolling-queue-variance.js";

/** A rule a rolling queue variance must pass. Check returns its problems, or none. */
export interface RollingQueueVarianceRule {
  check(item: RollingQueueVariance): string[];
}

export class RollingQueueVarianceAllowedLabelRule implements RollingQueueVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingQueueVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class RollingQueueVarianceImpressionsRangeRule implements RollingQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingQueueVariance): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingQueueVarianceCodePrefixRule implements RollingQueueVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingQueueVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingQueueVarianceExpiresAtRangeRule implements RollingQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingQueueVariance): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling queue variance. */
export class RollingQueueVarianceValidator {
  rules: RollingQueueVarianceRule[];

  constructor(rules: RollingQueueVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingQueueVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingQueueVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingQueueVariance[]): Map<string, string[]> {
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

export function defaultRollingQueueVarianceValidator(): RollingQueueVarianceValidator {
  return new RollingQueueVarianceValidator(
    [
      new RollingQueueVarianceAllowedLabelRule(["weighted"]),
      new RollingQueueVarianceImpressionsRangeRule(32, 120),
      new RollingQueueVarianceCodePrefixRule("REF"),
      new RollingQueueVarianceExpiresAtRangeRule(255, 3600),
    ],
  );
}

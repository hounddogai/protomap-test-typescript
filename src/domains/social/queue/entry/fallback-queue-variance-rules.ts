import { FallbackQueueVariance } from "./fallback-queue-variance.js";

/** A rule a fallback queue variance must pass. Check returns its problems, or none. */
export interface FallbackQueueVarianceRule {
  check(item: FallbackQueueVariance): string[];
}

export class FallbackQueueVarianceRequiredCohortRule implements FallbackQueueVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueVariance): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackQueueVarianceCeilingRangeRule implements FallbackQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueVariance): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackQueueVarianceCodePrefixRule implements FallbackQueueVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackQueueVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackQueueVarianceMarginRangeRule implements FallbackQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueVariance): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackQueueVarianceClicksRangeRule implements FallbackQueueVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueVariance): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback queue variance. */
export class FallbackQueueVarianceValidator {
  rules: FallbackQueueVarianceRule[];

  constructor(rules: FallbackQueueVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackQueueVariance): string[] {
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

  requireValid(item: FallbackQueueVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackQueueVariance[]): Map<string, string[]> {
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

export function defaultFallbackQueueVarianceValidator(): FallbackQueueVarianceValidator {
  return new FallbackQueueVarianceValidator(
    [
      new FallbackQueueVarianceRequiredCohortRule("fallback queue variance needs this field"),
      new FallbackQueueVarianceCeilingRangeRule(3.9, 1295.9),
      new FallbackQueueVarianceCodePrefixRule("Q"),
      new FallbackQueueVarianceMarginRangeRule(4.3, 1225.5),
      new FallbackQueueVarianceClicksRangeRule(255, 86400),
    ],
  );
}

import { LenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

/** A rule a lenient touchpoint variance must pass. Check returns its problems, or none. */
export interface LenientTouchpointVarianceRule {
  check(item: LenientTouchpointVariance): string[];
}

export class LenientTouchpointVarianceUpdatedAtRangeRule implements LenientTouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTouchpointVariance): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTouchpointVarianceCodePrefixRule implements LenientTouchpointVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientTouchpointVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientTouchpointVarianceRateRangeRule implements LenientTouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientTouchpointVariance): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientTouchpointVarianceRequiredNameRule implements LenientTouchpointVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTouchpointVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient touchpoint variance. */
export class LenientTouchpointVarianceValidator {
  rules: LenientTouchpointVarianceRule[];

  constructor(rules: LenientTouchpointVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTouchpointVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTouchpointVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTouchpointVariance[]): Map<string, string[]> {
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

export function defaultLenientTouchpointVarianceValidator(): LenientTouchpointVarianceValidator {
  return new LenientTouchpointVarianceValidator(
    [
      new LenientTouchpointVarianceUpdatedAtRangeRule(1000, 3600),
      new LenientTouchpointVarianceCodePrefixRule("Q"),
      new LenientTouchpointVarianceRateRangeRule(5, 2476.6),
      new LenientTouchpointVarianceRequiredNameRule("lenient touchpoint variance needs an entry"),
    ],
  );
}

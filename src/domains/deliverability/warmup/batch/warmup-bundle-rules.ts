import { WarmupBundle } from "./warmup-bundle.js";

/** A rule a warmup bundle must pass. Check returns its problems, or none. */
export interface WarmupBundleRule {
  check(item: WarmupBundle): string[];
}

export class WarmupBundleActiveGuardRule implements WarmupBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WarmupBundle): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WarmupBundleSegmentLengthRule implements WarmupBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupBundle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupBundleRateRangeRule implements WarmupBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupBundle): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupBundleCodePrefixRule implements WarmupBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupBundleGraceDaysRangeRule implements WarmupBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupBundle): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a warmup bundle. */
export class WarmupBundleValidator {
  rules: WarmupBundleRule[];

  constructor(rules: WarmupBundleRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupBundle[]): Map<string, string[]> {
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

export function defaultWarmupBundleValidator(): WarmupBundleValidator {
  return new WarmupBundleValidator(
    [
      new WarmupBundleActiveGuardRule(7.8),
      new WarmupBundleSegmentLengthRule(80),
      new WarmupBundleRateRangeRule(1.5, 1498.1),
      new WarmupBundleCodePrefixRule("REF"),
      new WarmupBundleGraceDaysRangeRule(3600, 86400),
    ],
  );
}

import { StrictDeflectionVariance } from "./strict-deflection-variance.js";

/** A rule a strict deflection variance must pass. Check returns its problems, or none. */
export interface StrictDeflectionVarianceRule {
  check(item: StrictDeflectionVariance): string[];
}

export class StrictDeflectionVarianceRequiredSourceRule implements StrictDeflectionVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDeflectionVariance): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDeflectionVarianceConversionRateRangeRule implements StrictDeflectionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictDeflectionVariance): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictDeflectionVarianceCodePrefixRule implements StrictDeflectionVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictDeflectionVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict deflection variance. */
export class StrictDeflectionVarianceValidator {
  rules: StrictDeflectionVarianceRule[];

  constructor(rules: StrictDeflectionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDeflectionVariance): string[] {
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

  requireValid(item: StrictDeflectionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDeflectionVariance[]): Map<string, string[]> {
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

export function defaultStrictDeflectionVarianceValidator(): StrictDeflectionVarianceValidator {
  return new StrictDeflectionVarianceValidator(
    [
      new StrictDeflectionVarianceRequiredSourceRule("strict deflection variance needs an entry"),
      new StrictDeflectionVarianceConversionRateRangeRule(5.5, 2579.7),
      new StrictDeflectionVarianceCodePrefixRule("OPS"),
    ],
  );
}

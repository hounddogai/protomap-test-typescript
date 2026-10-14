import { ConversionCycle } from "./conversion-cycle.js";

/** A rule a conversion cycle must pass. Check returns its problems, or none. */
export interface ConversionCycleRule {
  check(item: ConversionCycle): string[];
}

export class ConversionCycleCodePrefixRule implements ConversionCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionCycleExpiresAtRangeRule implements ConversionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionCycle): string[] {
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

export class ConversionCycleRequiredSegmentRule implements ConversionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionCycle): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionCycleThresholdRangeRule implements ConversionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionCycle): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a conversion cycle. */
export class ConversionCycleValidator {
  rules: ConversionCycleRule[];

  constructor(rules: ConversionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionCycle): string[] {
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

  requireValid(item: ConversionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionCycle[]): Map<string, string[]> {
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

export function defaultConversionCycleValidator(): ConversionCycleValidator {
  return new ConversionCycleValidator(
    [
      new ConversionCycleCodePrefixRule("OPS"),
      new ConversionCycleExpiresAtRangeRule(16, 86400),
      new ConversionCycleRequiredSegmentRule("conversion cycle needs a value"),
      new ConversionCycleThresholdRangeRule(0.4, 728.8),
    ],
  );
}

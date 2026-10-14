import * as text from "../../../../kit/text.js";
import { JourneyBundle } from "./journey-bundle.js";

/** A rule a journey bundle must pass. Check returns its problems, or none. */
export interface JourneyBundleRule {
  check(item: JourneyBundle): string[];
}

export class JourneyBundleVariantLengthRule implements JourneyBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBundle): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyBundleCapacityRangeRule implements JourneyBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBundle): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyBundleRequiredVariantRule implements JourneyBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyBundle): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyBundleUtmSourceLengthRule implements JourneyBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBundle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyBundleAllowedUtmSourceRule implements JourneyBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

/** Runs every rule of a journey bundle. */
export class JourneyBundleValidator {
  rules: JourneyBundleRule[];

  constructor(rules: JourneyBundleRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyBundle[]): Map<string, string[]> {
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

export function defaultJourneyBundleValidator(): JourneyBundleValidator {
  return new JourneyBundleValidator(
    [
      new JourneyBundleVariantLengthRule(86400),
      new JourneyBundleCapacityRangeRule(16, 1000),
      new JourneyBundleRequiredVariantRule("journey bundle needs an entry"),
      new JourneyBundleUtmSourceLengthRule(1000),
      new JourneyBundleAllowedUtmSourceRule(["capped", "lenient", "strict"]),
    ],
  );
}

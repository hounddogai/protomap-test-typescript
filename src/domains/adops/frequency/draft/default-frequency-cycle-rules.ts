import * as text from "../../../../kit/text.js";
import { DefaultFrequencyCycle } from "./default-frequency-cycle.js";

/** A rule a default frequency cycle must pass. Check returns its problems, or none. */
export interface DefaultFrequencyCycleRule {
  check(item: DefaultFrequencyCycle): string[];
}

export class DefaultFrequencyCycleCodePrefixRule implements DefaultFrequencyCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFrequencyCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultFrequencyCycleStartsAtRangeRule implements DefaultFrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencyCycle): string[] {
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

export class DefaultFrequencyCycleAllowedCodeRule implements DefaultFrequencyCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultFrequencyCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class DefaultFrequencyCycleTitleLengthRule implements DefaultFrequencyCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFrequencyCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default frequency cycle. */
export class DefaultFrequencyCycleValidator {
  rules: DefaultFrequencyCycleRule[];

  constructor(rules: DefaultFrequencyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencyCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFrequencyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencyCycle[]): Map<string, string[]> {
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

export function defaultDefaultFrequencyCycleValidator(): DefaultFrequencyCycleValidator {
  return new DefaultFrequencyCycleValidator(
    [
      new DefaultFrequencyCycleCodePrefixRule("OPS"),
      new DefaultFrequencyCycleStartsAtRangeRule(255, 3600),
      new DefaultFrequencyCycleAllowedCodeRule(["default"]),
      new DefaultFrequencyCycleTitleLengthRule(1000),
    ],
  );
}

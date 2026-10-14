import { FallbackModelAllocation } from "./fallback-model-allocation.js";

/** A rule a fallback model allocation must pass. Check returns its problems, or none. */
export interface FallbackModelAllocationRule {
  check(item: FallbackModelAllocation): string[];
}

export class FallbackModelAllocationRequiredDescriptionRule implements FallbackModelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackModelAllocation): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackModelAllocationDurationMinutesRangeRule implements FallbackModelAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackModelAllocation): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackModelAllocationCodePrefixRule implements FallbackModelAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackModelAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackModelAllocationCodeLengthRule implements FallbackModelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackModelAllocationRegionLengthRule implements FallbackModelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackModelAllocation): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback model allocation. */
export class FallbackModelAllocationValidator {
  rules: FallbackModelAllocationRule[];

  constructor(rules: FallbackModelAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackModelAllocation): string[] {
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

  requireValid(item: FallbackModelAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackModelAllocation[]): Map<string, string[]> {
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

export function defaultFallbackModelAllocationValidator(): FallbackModelAllocationValidator {
  return new FallbackModelAllocationValidator(
    [
      new FallbackModelAllocationRequiredDescriptionRule("fallback model allocation needs a value"),
      new FallbackModelAllocationDurationMinutesRangeRule(80, 1000),
      new FallbackModelAllocationCodePrefixRule("X"),
      new FallbackModelAllocationCodeLengthRule(120),
      new FallbackModelAllocationRegionLengthRule(64),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { FallbackConversionMapping } from "./fallback-conversion-mapping.js";

/** A rule a fallback conversion mapping must pass. Check returns its problems, or none. */
export interface FallbackConversionMappingRule {
  check(item: FallbackConversionMapping): string[];
}

export class FallbackConversionMappingCodePrefixRule implements FallbackConversionMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackConversionMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackConversionMappingThresholdRangeRule implements FallbackConversionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackConversionMapping): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackConversionMappingAttemptsRangeRule implements FallbackConversionMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackConversionMapping): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackConversionMappingAllowedNameRule implements FallbackConversionMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackConversionMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class FallbackConversionMappingRequiredCodeRule implements FallbackConversionMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackConversionMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback conversion mapping. */
export class FallbackConversionMappingValidator {
  rules: FallbackConversionMappingRule[];

  constructor(rules: FallbackConversionMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackConversionMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackConversionMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackConversionMapping[]): Map<string, string[]> {
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

export function defaultFallbackConversionMappingValidator(): FallbackConversionMappingValidator {
  return new FallbackConversionMappingValidator(
    [
      new FallbackConversionMappingCodePrefixRule("ACM"),
      new FallbackConversionMappingThresholdRangeRule(1.9, 714.4),
      new FallbackConversionMappingAttemptsRangeRule(1000, 86400),
      new FallbackConversionMappingAllowedNameRule([]),
      new FallbackConversionMappingRequiredCodeRule("fallback conversion mapping needs a value"),
    ],
  );
}

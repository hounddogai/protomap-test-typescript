import { TieredWindowException } from "./tiered-window-exception.js";

/** A rule a tiered window exception must pass. Check returns its problems, or none. */
export interface TieredWindowExceptionRule {
  check(item: TieredWindowException): string[];
}

export class TieredWindowExceptionTitleLengthRule implements TieredWindowExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWindowExceptionCodePrefixRule implements TieredWindowExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredWindowException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredWindowExceptionImpressionsRangeRule implements TieredWindowExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWindowException): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWindowExceptionMaximumRangeRule implements TieredWindowExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWindowException): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWindowExceptionCodeLengthRule implements TieredWindowExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWindowException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered window exception. */
export class TieredWindowExceptionValidator {
  rules: TieredWindowExceptionRule[];

  constructor(rules: TieredWindowExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWindowException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWindowException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWindowException[]): Map<string, string[]> {
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

export function defaultTieredWindowExceptionValidator(): TieredWindowExceptionValidator {
  return new TieredWindowExceptionValidator(
    [
      new TieredWindowExceptionTitleLengthRule(86400),
      new TieredWindowExceptionCodePrefixRule("OPS"),
      new TieredWindowExceptionImpressionsRangeRule(16, 1000),
      new TieredWindowExceptionMaximumRangeRule(4.4, 3542.8),
      new TieredWindowExceptionCodeLengthRule(120),
    ],
  );
}

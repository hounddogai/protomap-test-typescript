import { CsatGroup } from "./csat-group.js";

/** A rule a csat group must pass. Check returns its problems, or none. */
export interface CsatGroupRule {
  check(item: CsatGroup): string[];
}

export class CsatGroupBatchSizeRangeRule implements CsatGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatGroup): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatGroupCodePrefixRule implements CsatGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatGroupLocaleLengthRule implements CsatGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatGroup): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatGroupCodeLengthRule implements CsatGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat group. */
export class CsatGroupValidator {
  rules: CsatGroupRule[];

  constructor(rules: CsatGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CsatGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatGroup[]): Map<string, string[]> {
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

export function defaultCsatGroupValidator(): CsatGroupValidator {
  return new CsatGroupValidator(
    [
      new CsatGroupBatchSizeRangeRule(32, 1000),
      new CsatGroupCodePrefixRule("OPS"),
      new CsatGroupLocaleLengthRule(80),
      new CsatGroupCodeLengthRule(32),
    ],
  );
}

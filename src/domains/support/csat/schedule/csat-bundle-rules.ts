import { CsatBundle } from "./csat-bundle.js";

/** A rule a csat bundle must pass. Check returns its problems, or none. */
export interface CsatBundleRule {
  check(item: CsatBundle): string[];
}

export class CsatBundleTitleLengthRule implements CsatBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatBundleChannelLengthRule implements CsatBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatBundle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatBundleRequiredChannelRule implements CsatBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CsatBundleQuantityRangeRule implements CsatBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatBundle): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatBundleActiveGuardRule implements CsatBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatBundle): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CsatBundleCodeLengthRule implements CsatBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat bundle. */
export class CsatBundleValidator {
  rules: CsatBundleRule[];

  constructor(rules: CsatBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CsatBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatBundle[]): Map<string, string[]> {
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

export function defaultCsatBundleValidator(): CsatBundleValidator {
  return new CsatBundleValidator(
    [
      new CsatBundleTitleLengthRule(16),
      new CsatBundleChannelLengthRule(64),
      new CsatBundleRequiredChannelRule("csat bundle needs a value"),
      new CsatBundleQuantityRangeRule(3600, 86400),
      new CsatBundleActiveGuardRule(4.1),
      new CsatBundleCodeLengthRule(1000),
    ],
  );
}

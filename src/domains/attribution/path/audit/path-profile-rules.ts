import { PathProfile } from "./path-profile.js";

/** A rule a path profile must pass. Check returns its problems, or none. */
export interface PathProfileRule {
  check(item: PathProfile): string[];
}

export class PathProfileRequiredCodeRule implements PathProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathProfileTitleLengthRule implements PathProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathProfile): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathProfileCodeLengthRule implements PathProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathProfileCodePrefixRule implements PathProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathProfileConversionRateRangeRule implements PathProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathProfile): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathProfileClicksRangeRule implements PathProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathProfile): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a path profile. */
export class PathProfileValidator {
  rules: PathProfileRule[];

  constructor(rules: PathProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PathProfile): string[] {
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

  requireValid(item: PathProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathProfile[]): Map<string, string[]> {
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

export function defaultPathProfileValidator(): PathProfileValidator {
  return new PathProfileValidator(
    [
      new PathProfileRequiredCodeRule("path profile needs a value"),
      new PathProfileTitleLengthRule(255),
      new PathProfileCodeLengthRule(64),
      new PathProfileCodePrefixRule("X"),
      new PathProfileConversionRateRangeRule(7.6, 3056.3),
      new PathProfileClicksRangeRule(255, 86400),
    ],
  );
}

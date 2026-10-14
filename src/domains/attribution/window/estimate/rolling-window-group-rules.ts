import * as text from "../../../../kit/text.js";
import { RollingWindowGroup } from "./rolling-window-group.js";

/** A rule a rolling window group must pass. Check returns its problems, or none. */
export interface RollingWindowGroupRule {
  check(item: RollingWindowGroup): string[];
}

export class RollingWindowGroupAllowedTitleRule implements RollingWindowGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWindowGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class RollingWindowGroupRequiredDescriptionRule implements RollingWindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowGroup): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWindowGroupDescriptionLengthRule implements RollingWindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWindowGroup): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWindowGroupConversionRateRangeRule implements RollingWindowGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowGroup): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWindowGroupCodePrefixRule implements RollingWindowGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingWindowGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingWindowGroupRateRangeRule implements RollingWindowGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowGroup): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling window group. */
export class RollingWindowGroupValidator {
  rules: RollingWindowGroupRule[];

  constructor(rules: RollingWindowGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWindowGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWindowGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWindowGroup[]): Map<string, string[]> {
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

export function defaultRollingWindowGroupValidator(): RollingWindowGroupValidator {
  return new RollingWindowGroupValidator(
    [
      new RollingWindowGroupAllowedTitleRule(["default"]),
      new RollingWindowGroupRequiredDescriptionRule("rolling window group needs this field"),
      new RollingWindowGroupDescriptionLengthRule(3600),
      new RollingWindowGroupConversionRateRangeRule(5.8, 4129.4),
      new RollingWindowGroupCodePrefixRule("REF"),
      new RollingWindowGroupRateRangeRule(7.1, 146.4),
    ],
  );
}

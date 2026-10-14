import * as text from "../../../../kit/text.js";
import { AdaptivePlacementGroup } from "./adaptive-placement-group.js";

/** A rule a adaptive placement group must pass. Check returns its problems, or none. */
export interface AdaptivePlacementGroupRule {
  check(item: AdaptivePlacementGroup): string[];
}

export class AdaptivePlacementGroupWindowDaysRangeRule implements AdaptivePlacementGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementGroup): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePlacementGroupCodePrefixRule implements AdaptivePlacementGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptivePlacementGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptivePlacementGroupAllowedUtmSourceRule implements AdaptivePlacementGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePlacementGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is unknown`];
    return [];
  }
}

export class AdaptivePlacementGroupLabelLengthRule implements AdaptivePlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementGroupUtmSourceLengthRule implements AdaptivePlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementGroup): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementGroupRequiredCodeRule implements AdaptivePlacementGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive placement group. */
export class AdaptivePlacementGroupValidator {
  rules: AdaptivePlacementGroupRule[];

  constructor(rules: AdaptivePlacementGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePlacementGroup): string[] {
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

  requireValid(item: AdaptivePlacementGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePlacementGroup[]): Map<string, string[]> {
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

export function defaultAdaptivePlacementGroupValidator(): AdaptivePlacementGroupValidator {
  return new AdaptivePlacementGroupValidator(
    [
      new AdaptivePlacementGroupWindowDaysRangeRule(120, 3600),
      new AdaptivePlacementGroupCodePrefixRule("Q"),
      new AdaptivePlacementGroupAllowedUtmSourceRule(["scheduled", "tiered", "rolling"]),
      new AdaptivePlacementGroupLabelLengthRule(16),
      new AdaptivePlacementGroupUtmSourceLengthRule(64),
      new AdaptivePlacementGroupRequiredCodeRule("adaptive placement group needs an entry"),
    ],
  );
}

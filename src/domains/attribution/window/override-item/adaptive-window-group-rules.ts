import * as text from "../../../../kit/text.js";
import { AdaptiveWindowGroup } from "./adaptive-window-group.js";

/** A rule a adaptive window group must pass. Check returns its problems, or none. */
export interface AdaptiveWindowGroupRule {
  check(item: AdaptiveWindowGroup): string[];
}

export class AdaptiveWindowGroupAllowedJourneyIdRule implements AdaptiveWindowGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveWindowGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is out of range`];
    return [];
  }
}

export class AdaptiveWindowGroupDiscountRangeRule implements AdaptiveWindowGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveWindowGroup): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveWindowGroupTitleLengthRule implements AdaptiveWindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWindowGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWindowGroupCodeLengthRule implements AdaptiveWindowGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveWindowGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveWindowGroupRequiredUtmSourceRule implements AdaptiveWindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWindowGroup): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveWindowGroupRequiredChecksumRule implements AdaptiveWindowGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveWindowGroup): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive window group. */
export class AdaptiveWindowGroupValidator {
  rules: AdaptiveWindowGroupRule[];

  constructor(rules: AdaptiveWindowGroupRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveWindowGroup): string[] {
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

  requireValid(item: AdaptiveWindowGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveWindowGroup[]): Map<string, string[]> {
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

export function defaultAdaptiveWindowGroupValidator(): AdaptiveWindowGroupValidator {
  return new AdaptiveWindowGroupValidator(
    [
      new AdaptiveWindowGroupAllowedJourneyIdRule(["lenient"]),
      new AdaptiveWindowGroupDiscountRangeRule(5.6, 4281.2),
      new AdaptiveWindowGroupTitleLengthRule(16),
      new AdaptiveWindowGroupCodeLengthRule(86400),
      new AdaptiveWindowGroupRequiredUtmSourceRule("adaptive window group needs an entry"),
      new AdaptiveWindowGroupRequiredChecksumRule("adaptive window group needs a value"),
    ],
  );
}

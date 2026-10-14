import * as text from "../../../../kit/text.js";
import { SenderBaseline } from "./sender-baseline.js";

/** A rule a sender baseline must pass. Check returns its problems, or none. */
export interface SenderBaselineRule {
  check(item: SenderBaseline): string[];
}

export class SenderBaselineCountryLengthRule implements SenderBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderBaseline): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderBaselineCeilingRangeRule implements SenderBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderBaseline): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderBaselineAllowedCampaignRefRule implements SenderBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is duplicated`];
    return [];
  }
}

export class SenderBaselineTitleLengthRule implements SenderBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderBaselineRequiredCountryRule implements SenderBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderBaseline): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender baseline. */
export class SenderBaselineValidator {
  rules: SenderBaselineRule[];

  constructor(rules: SenderBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SenderBaseline): string[] {
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

  requireValid(item: SenderBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderBaseline[]): Map<string, string[]> {
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

export function defaultSenderBaselineValidator(): SenderBaselineValidator {
  return new SenderBaselineValidator(
    [
      new SenderBaselineCountryLengthRule(120),
      new SenderBaselineCeilingRangeRule(2.1, 3297.1),
      new SenderBaselineAllowedCampaignRefRule(["primary"]),
      new SenderBaselineTitleLengthRule(80),
      new SenderBaselineRequiredCountryRule("sender baseline needs this field"),
    ],
  );
}

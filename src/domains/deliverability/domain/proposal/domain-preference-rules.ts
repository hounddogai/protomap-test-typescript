import * as text from "../../../../kit/text.js";
import { DomainPreference } from "./domain-preference.js";

/** A rule a domain preference must pass. Check returns its problems, or none. */
export interface DomainPreferenceRule {
  check(item: DomainPreference): string[];
}

export class DomainPreferenceRequiredCodeRule implements DomainPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DomainPreferenceCohortLengthRule implements DomainPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainPreference): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainPreferenceAllowedCampaignRefRule implements DomainPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is out of range`];
    return [];
  }
}

export class DomainPreferenceQuantityRangeRule implements DomainPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainPreference): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a domain preference. */
export class DomainPreferenceValidator {
  rules: DomainPreferenceRule[];

  constructor(rules: DomainPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: DomainPreference): string[] {
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

  requireValid(item: DomainPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainPreference[]): Map<string, string[]> {
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

export function defaultDomainPreferenceValidator(): DomainPreferenceValidator {
  return new DomainPreferenceValidator(
    [
      new DomainPreferenceRequiredCodeRule("domain preference needs an entry"),
      new DomainPreferenceCohortLengthRule(120),
      new DomainPreferenceAllowedCampaignRefRule(["scheduled"]),
      new DomainPreferenceQuantityRangeRule(16, 255),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { EscalationProfile } from "./escalation-profile.js";

/** A rule a escalation profile must pass. Check returns its problems, or none. */
export interface EscalationProfileRule {
  check(item: EscalationProfile): string[];
}

export class EscalationProfileRequiredCodeRule implements EscalationProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationProfileRequiredTitleRule implements EscalationProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationProfileAllowedTitleRule implements EscalationProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class EscalationProfileCodePrefixRule implements EscalationProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationProfileDurationMinutesRangeRule implements EscalationProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationProfile): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationProfileEndsAtRangeRule implements EscalationProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationProfile): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation profile. */
export class EscalationProfileValidator {
  rules: EscalationProfileRule[];

  constructor(rules: EscalationProfileRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationProfile[]): Map<string, string[]> {
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

export function defaultEscalationProfileValidator(): EscalationProfileValidator {
  return new EscalationProfileValidator(
    [
      new EscalationProfileRequiredCodeRule("escalation profile needs an entry"),
      new EscalationProfileRequiredTitleRule("escalation profile needs this field"),
      new EscalationProfileAllowedTitleRule(["scheduled", "default", "rolling"]),
      new EscalationProfileCodePrefixRule("ACM"),
      new EscalationProfileDurationMinutesRangeRule(1000, 1000),
      new EscalationProfileEndsAtRangeRule(255, 86400),
    ],
  );
}

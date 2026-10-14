import * as text from "../../../../kit/text.js";
import { PendingFunnelProfile } from "./pending-funnel-profile.js";

/** A rule a pending funnel profile must pass. Check returns its problems, or none. */
export interface PendingFunnelProfileRule {
  check(item: PendingFunnelProfile): string[];
}

export class PendingFunnelProfileCategoryLengthRule implements PendingFunnelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFunnelProfile): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFunnelProfileRequiredCategoryRule implements PendingFunnelProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFunnelProfile): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFunnelProfileLabelLengthRule implements PendingFunnelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFunnelProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFunnelProfileDurationMinutesRangeRule implements PendingFunnelProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFunnelProfile): string[] {
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

export class PendingFunnelProfileAllowedCategoryRule implements PendingFunnelProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingFunnelProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a pending funnel profile. */
export class PendingFunnelProfileValidator {
  rules: PendingFunnelProfileRule[];

  constructor(rules: PendingFunnelProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFunnelProfile): string[] {
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

  requireValid(item: PendingFunnelProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFunnelProfile[]): Map<string, string[]> {
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

export function defaultPendingFunnelProfileValidator(): PendingFunnelProfileValidator {
  return new PendingFunnelProfileValidator(
    [
      new PendingFunnelProfileCategoryLengthRule(64),
      new PendingFunnelProfileRequiredCategoryRule("pending funnel profile needs an entry"),
      new PendingFunnelProfileLabelLengthRule(255),
      new PendingFunnelProfileDurationMinutesRangeRule(255, 86400),
      new PendingFunnelProfileAllowedCategoryRule(["pending", "pending", "global"]),
    ],
  );
}

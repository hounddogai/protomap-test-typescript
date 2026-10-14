import * as text from "../../../../kit/text.js";
import { RollingStreakClaim } from "./rolling-streak-claim.js";

/** A rule a rolling streak claim must pass. Check returns its problems, or none. */
export interface RollingStreakClaimRule {
  check(item: RollingStreakClaim): string[];
}

export class RollingStreakClaimVersionRangeRule implements RollingStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStreakClaim): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingStreakClaimAllowedLabelRule implements RollingStreakClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingStreakClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

export class RollingStreakClaimWindowDaysRangeRule implements RollingStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStreakClaim): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingStreakClaimRequiredCampaignRefRule implements RollingStreakClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStreakClaim): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStreakClaimCeilingRangeRule implements RollingStreakClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStreakClaim): string[] {
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

export class RollingStreakClaimLabelLengthRule implements RollingStreakClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStreakClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling streak claim. */
export class RollingStreakClaimValidator {
  rules: RollingStreakClaimRule[];

  constructor(rules: RollingStreakClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStreakClaim): string[] {
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

  requireValid(item: RollingStreakClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStreakClaim[]): Map<string, string[]> {
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

export function defaultRollingStreakClaimValidator(): RollingStreakClaimValidator {
  return new RollingStreakClaimValidator(
    [
      new RollingStreakClaimVersionRangeRule(120, 86400),
      new RollingStreakClaimAllowedLabelRule(["strict", "tiered", "primary"]),
      new RollingStreakClaimWindowDaysRangeRule(16, 255),
      new RollingStreakClaimRequiredCampaignRefRule("rolling streak claim needs a value"),
      new RollingStreakClaimCeilingRangeRule(7.5, 177),
      new RollingStreakClaimLabelLengthRule(80),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { PendingRewardRequest } from "./pending-reward-request.js";

/** A rule a pending reward request must pass. Check returns its problems, or none. */
export interface PendingRewardRequestRule {
  check(item: PendingRewardRequest): string[];
}

export class PendingRewardRequestSegmentLengthRule implements PendingRewardRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRequest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRequestRequiredUtmSourceRule implements PendingRewardRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRequest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRequestAllowedUtmSourceRule implements PendingRewardRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingRewardRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is not allowed`];
    return [];
  }
}

export class PendingRewardRequestAttemptsRangeRule implements PendingRewardRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRequest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardRequestGraceDaysRangeRule implements PendingRewardRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRequest): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingRewardRequestCodePrefixRule implements PendingRewardRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRewardRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending reward request. */
export class PendingRewardRequestValidator {
  rules: PendingRewardRequestRule[];

  constructor(rules: PendingRewardRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRewardRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRequest[]): Map<string, string[]> {
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

export function defaultPendingRewardRequestValidator(): PendingRewardRequestValidator {
  return new PendingRewardRequestValidator(
    [
      new PendingRewardRequestSegmentLengthRule(1000),
      new PendingRewardRequestRequiredUtmSourceRule("pending reward request needs this field"),
      new PendingRewardRequestAllowedUtmSourceRule(["default"]),
      new PendingRewardRequestAttemptsRangeRule(64, 80),
      new PendingRewardRequestGraceDaysRangeRule(32, 80),
      new PendingRewardRequestCodePrefixRule("ACM"),
    ],
  );
}

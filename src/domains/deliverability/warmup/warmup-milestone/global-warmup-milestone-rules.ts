import * as text from "../../../../kit/text.js";
import { GlobalWarmupMilestone } from "./global-warmup-milestone.js";

/** A rule a global warmup milestone must pass. Check returns its problems, or none. */
export interface GlobalWarmupMilestoneRule {
  check(item: GlobalWarmupMilestone): string[];
}

export class GlobalWarmupMilestoneNameLengthRule implements GlobalWarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWarmupMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWarmupMilestoneApprovedGuardRule implements GlobalWarmupMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalWarmupMilestone): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class GlobalWarmupMilestoneCurrencyLengthRule implements GlobalWarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalWarmupMilestone): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalWarmupMilestoneSequenceRangeRule implements GlobalWarmupMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWarmupMilestone): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalWarmupMilestoneRequiredCodeRule implements GlobalWarmupMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWarmupMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalWarmupMilestoneAllowedNameRule implements GlobalWarmupMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalWarmupMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

/** Runs every rule of a global warmup milestone. */
export class GlobalWarmupMilestoneValidator {
  rules: GlobalWarmupMilestoneRule[];

  constructor(rules: GlobalWarmupMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWarmupMilestone): string[] {
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

  requireValid(item: GlobalWarmupMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWarmupMilestone[]): Map<string, string[]> {
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

export function defaultGlobalWarmupMilestoneValidator(): GlobalWarmupMilestoneValidator {
  return new GlobalWarmupMilestoneValidator(
    [
      new GlobalWarmupMilestoneNameLengthRule(32),
      new GlobalWarmupMilestoneApprovedGuardRule(86400),
      new GlobalWarmupMilestoneCurrencyLengthRule(64),
      new GlobalWarmupMilestoneSequenceRangeRule(64, 255),
      new GlobalWarmupMilestoneRequiredCodeRule("global warmup milestone needs an entry"),
      new GlobalWarmupMilestoneAllowedNameRule(["default", "default"]),
    ],
  );
}

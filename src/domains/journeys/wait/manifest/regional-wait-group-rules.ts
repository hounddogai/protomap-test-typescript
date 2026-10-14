import * as text from "../../../../kit/text.js";
import { RegionalWaitGroup } from "./regional-wait-group.js";

/** A rule a regional wait group must pass. Check returns its problems, or none. */
export interface RegionalWaitGroupRule {
  check(item: RegionalWaitGroup): string[];
}

export class RegionalWaitGroupRequiredCodeRule implements RegionalWaitGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWaitGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWaitGroupAttemptsRangeRule implements RegionalWaitGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalWaitGroup): string[] {
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

export class RegionalWaitGroupTimezoneLengthRule implements RegionalWaitGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWaitGroup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalWaitGroupAllowedCampaignRefRule implements RegionalWaitGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalWaitGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is blocked`];
    return [];
  }
}

/** Runs every rule of a regional wait group. */
export class RegionalWaitGroupValidator {
  rules: RegionalWaitGroupRule[];

  constructor(rules: RegionalWaitGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalWaitGroup): string[] {
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

  requireValid(item: RegionalWaitGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalWaitGroup[]): Map<string, string[]> {
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

export function defaultRegionalWaitGroupValidator(): RegionalWaitGroupValidator {
  return new RegionalWaitGroupValidator(
    [
      new RegionalWaitGroupRequiredCodeRule("regional wait group needs a value"),
      new RegionalWaitGroupAttemptsRangeRule(64, 1000),
      new RegionalWaitGroupTimezoneLengthRule(255),
      new RegionalWaitGroupAllowedCampaignRefRule([]),
    ],
  );
}

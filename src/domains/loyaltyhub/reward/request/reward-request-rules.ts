import * as text from "../../../../kit/text.js";
import { RewardRequest } from "./reward-request.js";

/** A rule a reward request must pass. Check returns its problems, or none. */
export interface RewardRequestRule {
  check(item: RewardRequest): string[];
}

export class RewardRequestEndsAtRangeRule implements RewardRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRequest): string[] {
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

export class RewardRequestFrequencyCapRangeRule implements RewardRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRequest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRequestAllowedCodeRule implements RewardRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a reward request. */
export class RewardRequestValidator {
  rules: RewardRequestRule[];

  constructor(rules: RewardRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRequest[]): Map<string, string[]> {
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

export function defaultRewardRequestValidator(): RewardRequestValidator {
  return new RewardRequestValidator(
    [
      new RewardRequestEndsAtRangeRule(32, 255),
      new RewardRequestFrequencyCapRangeRule(16, 3600),
      new RewardRequestAllowedCodeRule(["capped"]),
    ],
  );
}

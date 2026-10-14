import * as text from "../../../../kit/text.js";
import { WarmupPolicy } from "./warmup-policy.js";

/** A rule a warmup policy must pass. Check returns its problems, or none. */
export interface WarmupPolicyRule {
  check(item: WarmupPolicy): string[];
}

export class WarmupPolicyCodeLengthRule implements WarmupPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupPolicyAllowedCodeRule implements WarmupPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class WarmupPolicyScoreRangeRule implements WarmupPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupPolicy): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupPolicyDurationMinutesRangeRule implements WarmupPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupPolicy): string[] {
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

export class WarmupPolicyMinimumRangeRule implements WarmupPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupPolicy): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupPolicyBudgetRangeRule implements WarmupPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupPolicy): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a warmup policy. */
export class WarmupPolicyValidator {
  rules: WarmupPolicyRule[];

  constructor(rules: WarmupPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupPolicy[]): Map<string, string[]> {
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

export function defaultWarmupPolicyValidator(): WarmupPolicyValidator {
  return new WarmupPolicyValidator(
    [
      new WarmupPolicyCodeLengthRule(120),
      new WarmupPolicyAllowedCodeRule(["adaptive"]),
      new WarmupPolicyScoreRangeRule(6.9, 2345.1),
      new WarmupPolicyDurationMinutesRangeRule(64, 64),
      new WarmupPolicyMinimumRangeRule(2.3, 1887.3),
      new WarmupPolicyBudgetRangeRule(0, 1811.6),
    ],
  );
}

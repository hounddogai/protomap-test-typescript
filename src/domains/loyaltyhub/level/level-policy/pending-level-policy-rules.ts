import * as text from "../../../../kit/text.js";
import { PendingLevelPolicy } from "./pending-level-policy.js";

/** A rule a pending level policy must pass. Check returns its problems, or none. */
export interface PendingLevelPolicyRule {
  check(item: PendingLevelPolicy): string[];
}

export class PendingLevelPolicyAllowedSourceRule implements PendingLevelPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingLevelPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is missing`];
    return [];
  }
}

export class PendingLevelPolicyRequiredSourceRule implements PendingLevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelPolicy): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelPolicyThresholdRangeRule implements PendingLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPolicy): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLevelPolicySourceLengthRule implements PendingLevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelPolicy): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelPolicyBidRangeRule implements PendingLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelPolicy): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending level policy. */
export class PendingLevelPolicyValidator {
  rules: PendingLevelPolicyRule[];

  constructor(rules: PendingLevelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingLevelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelPolicy[]): Map<string, string[]> {
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

export function defaultPendingLevelPolicyValidator(): PendingLevelPolicyValidator {
  return new PendingLevelPolicyValidator(
    [
      new PendingLevelPolicyAllowedSourceRule(["global"]),
      new PendingLevelPolicyRequiredSourceRule("pending level policy needs an entry"),
      new PendingLevelPolicyThresholdRangeRule(6.4, 1791.4),
      new PendingLevelPolicySourceLengthRule(86400),
      new PendingLevelPolicyBidRangeRule(7.4, 4767.6),
    ],
  );
}

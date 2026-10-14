import * as text from "../../../../kit/text.js";
import { ChallengePlan } from "./challenge-plan.js";

/** A rule a challenge plan must pass. Check returns its problems, or none. */
export interface ChallengePlanRule {
  check(item: ChallengePlan): string[];
}

export class ChallengePlanExpiresAtRangeRule implements ChallengePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengePlan): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengePlanCodePrefixRule implements ChallengePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengePlanNameLengthRule implements ChallengePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengePlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengePlanRatioRangeRule implements ChallengePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengePlan): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengePlanAllowedNameRule implements ChallengePlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengePlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

/** Runs every rule of a challenge plan. */
export class ChallengePlanValidator {
  rules: ChallengePlanRule[];

  constructor(rules: ChallengePlanRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengePlan[]): Map<string, string[]> {
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

export function defaultChallengePlanValidator(): ChallengePlanValidator {
  return new ChallengePlanValidator(
    [
      new ChallengePlanExpiresAtRangeRule(1000, 86400),
      new ChallengePlanCodePrefixRule("REF"),
      new ChallengePlanNameLengthRule(64),
      new ChallengePlanRatioRangeRule(0.5, 4903.2),
      new ChallengePlanAllowedNameRule(["rolling"]),
    ],
  );
}

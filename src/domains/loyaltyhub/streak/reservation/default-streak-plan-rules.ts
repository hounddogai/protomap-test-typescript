import * as text from "../../../../kit/text.js";
import { DefaultStreakPlan } from "./default-streak-plan.js";

/** A rule a default streak plan must pass. Check returns its problems, or none. */
export interface DefaultStreakPlanRule {
  check(item: DefaultStreakPlan): string[];
}

export class DefaultStreakPlanWeightRangeRule implements DefaultStreakPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStreakPlan): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultStreakPlanAllowedCodeRule implements DefaultStreakPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultStreakPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class DefaultStreakPlanCodePrefixRule implements DefaultStreakPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultStreakPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultStreakPlanCodeLengthRule implements DefaultStreakPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultStreakPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultStreakPlanRequiredCodeRule implements DefaultStreakPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultStreakPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default streak plan. */
export class DefaultStreakPlanValidator {
  rules: DefaultStreakPlanRule[];

  constructor(rules: DefaultStreakPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultStreakPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultStreakPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultStreakPlan[]): Map<string, string[]> {
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

export function defaultDefaultStreakPlanValidator(): DefaultStreakPlanValidator {
  return new DefaultStreakPlanValidator(
    [
      new DefaultStreakPlanWeightRangeRule(8.8, 3205.5),
      new DefaultStreakPlanAllowedCodeRule(["pending"]),
      new DefaultStreakPlanCodePrefixRule("REF"),
      new DefaultStreakPlanCodeLengthRule(80),
      new DefaultStreakPlanRequiredCodeRule("default streak plan needs an entry"),
    ],
  );
}

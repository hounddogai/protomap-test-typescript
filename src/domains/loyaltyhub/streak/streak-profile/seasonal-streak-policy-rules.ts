import * as text from "../../../../kit/text.js";
import { SeasonalStreakPolicy } from "./seasonal-streak-policy.js";

/** A rule a seasonal streak policy must pass. Check returns its problems, or none. */
export interface SeasonalStreakPolicyRule {
  check(item: SeasonalStreakPolicy): string[];
}

export class SeasonalStreakPolicyCodeLengthRule implements SeasonalStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStreakPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalStreakPolicyAllowedNameRule implements SeasonalStreakPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalStreakPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class SeasonalStreakPolicyNameLengthRule implements SeasonalStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStreakPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalStreakPolicyTimezoneLengthRule implements SeasonalStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStreakPolicy): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalStreakPolicyRequiredTimezoneRule implements SeasonalStreakPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStreakPolicy): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal streak policy. */
export class SeasonalStreakPolicyValidator {
  rules: SeasonalStreakPolicyRule[];

  constructor(rules: SeasonalStreakPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalStreakPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalStreakPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalStreakPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalStreakPolicyValidator(): SeasonalStreakPolicyValidator {
  return new SeasonalStreakPolicyValidator(
    [
      new SeasonalStreakPolicyCodeLengthRule(120),
      new SeasonalStreakPolicyAllowedNameRule(["legacy", "capped", "global"]),
      new SeasonalStreakPolicyNameLengthRule(3600),
      new SeasonalStreakPolicyTimezoneLengthRule(3600),
      new SeasonalStreakPolicyRequiredTimezoneRule("seasonal streak policy needs an entry"),
    ],
  );
}

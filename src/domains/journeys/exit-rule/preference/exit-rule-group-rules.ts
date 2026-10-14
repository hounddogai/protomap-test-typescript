import * as text from "../../../../kit/text.js";
import { ExitRuleGroup } from "./exit-rule-group.js";

/** A rule a exit rule group must pass. Check returns its problems, or none. */
export interface ExitRuleGroupRule {
  check(item: ExitRuleGroup): string[];
}

export class ExitRuleGroupAllowedJourneyIdRule implements ExitRuleGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is out of range`];
    return [];
  }
}

export class ExitRuleGroupDurationMinutesRangeRule implements ExitRuleGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleGroup): string[] {
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

export class ExitRuleGroupJourneyIdLengthRule implements ExitRuleGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleGroup): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleGroupRequiredCodeRule implements ExitRuleGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleGroupCodeLengthRule implements ExitRuleGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleGroupRequiredUnitRule implements ExitRuleGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleGroup): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule group. */
export class ExitRuleGroupValidator {
  rules: ExitRuleGroupRule[];

  constructor(rules: ExitRuleGroupRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleGroup): string[] {
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

  requireValid(item: ExitRuleGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleGroup[]): Map<string, string[]> {
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

export function defaultExitRuleGroupValidator(): ExitRuleGroupValidator {
  return new ExitRuleGroupValidator(
    [
      new ExitRuleGroupAllowedJourneyIdRule([]),
      new ExitRuleGroupDurationMinutesRangeRule(64, 255),
      new ExitRuleGroupJourneyIdLengthRule(80),
      new ExitRuleGroupRequiredCodeRule("exit rule group needs an entry"),
      new ExitRuleGroupCodeLengthRule(16),
      new ExitRuleGroupRequiredUnitRule("exit rule group needs an entry"),
    ],
  );
}

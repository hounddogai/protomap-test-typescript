import * as text from "../../../../kit/text.js";
import { SeasonalDomainPlan } from "./seasonal-domain-plan.js";

/** A rule a seasonal domain plan must pass. Check returns its problems, or none. */
export interface SeasonalDomainPlanRule {
  check(item: SeasonalDomainPlan): string[];
}

export class SeasonalDomainPlanRequiredTitleRule implements SeasonalDomainPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDomainPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDomainPlanContactEmailLengthRule implements SeasonalDomainPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainPlan): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDomainPlanAllowedCodeRule implements SeasonalDomainPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalDomainPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class SeasonalDomainPlanPriorityRangeRule implements SeasonalDomainPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDomainPlan): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDomainPlanUnitLengthRule implements SeasonalDomainPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainPlan): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal domain plan. */
export class SeasonalDomainPlanValidator {
  rules: SeasonalDomainPlanRule[];

  constructor(rules: SeasonalDomainPlanRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDomainPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDomainPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDomainPlan[]): Map<string, string[]> {
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

export function defaultSeasonalDomainPlanValidator(): SeasonalDomainPlanValidator {
  return new SeasonalDomainPlanValidator(
    [
      new SeasonalDomainPlanRequiredTitleRule("seasonal domain plan needs an entry"),
      new SeasonalDomainPlanContactEmailLengthRule(1000),
      new SeasonalDomainPlanAllowedCodeRule(["regional", "rolling", "default"]),
      new SeasonalDomainPlanPriorityRangeRule(64, 80),
      new SeasonalDomainPlanUnitLengthRule(86400),
    ],
  );
}

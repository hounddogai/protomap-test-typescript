import * as text from "../../../../kit/text.js";
import { ScheduledInsightPlan } from "./scheduled-insight-plan.js";

/** A rule a scheduled insight plan must pass. Check returns its problems, or none. */
export interface ScheduledInsightPlanRule {
  check(item: ScheduledInsightPlan): string[];
}

export class ScheduledInsightPlanJourneyIdLengthRule implements ScheduledInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInsightPlan): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInsightPlanLabelLengthRule implements ScheduledInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInsightPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInsightPlanRequiredCodeRule implements ScheduledInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInsightPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInsightPlanCodeLengthRule implements ScheduledInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInsightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInsightPlanSequenceRangeRule implements ScheduledInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInsightPlan): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledInsightPlanAllowedJourneyIdRule implements ScheduledInsightPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledInsightPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is above maximum`];
    return [];
  }
}

/** Runs every rule of a scheduled insight plan. */
export class ScheduledInsightPlanValidator {
  rules: ScheduledInsightPlanRule[];

  constructor(rules: ScheduledInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInsightPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInsightPlan[]): Map<string, string[]> {
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

export function defaultScheduledInsightPlanValidator(): ScheduledInsightPlanValidator {
  return new ScheduledInsightPlanValidator(
    [
      new ScheduledInsightPlanJourneyIdLengthRule(64),
      new ScheduledInsightPlanLabelLengthRule(64),
      new ScheduledInsightPlanRequiredCodeRule("scheduled insight plan needs a value"),
      new ScheduledInsightPlanCodeLengthRule(80),
      new ScheduledInsightPlanSequenceRangeRule(64, 80),
      new ScheduledInsightPlanAllowedJourneyIdRule([]),
    ],
  );
}

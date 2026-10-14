import * as text from "../../../../kit/text.js";
import { FrequencyPlan } from "./frequency-plan.js";

/** A rule a frequency plan must pass. Check returns its problems, or none. */
export interface FrequencyPlanRule {
  check(item: FrequencyPlan): string[];
}

export class FrequencyPlanAllowedCodeRule implements FrequencyPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class FrequencyPlanCohortLengthRule implements FrequencyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyPlan): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyPlanRequiredNotesRule implements FrequencyPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyPlan): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyPlanTitleLengthRule implements FrequencyPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency plan. */
export class FrequencyPlanValidator {
  rules: FrequencyPlanRule[];

  constructor(rules: FrequencyPlanRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyPlan): string[] {
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

  requireValid(item: FrequencyPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyPlan[]): Map<string, string[]> {
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

export function defaultFrequencyPlanValidator(): FrequencyPlanValidator {
  return new FrequencyPlanValidator(
    [
      new FrequencyPlanAllowedCodeRule(["fallback"]),
      new FrequencyPlanCohortLengthRule(80),
      new FrequencyPlanRequiredNotesRule("frequency plan needs this field"),
      new FrequencyPlanTitleLengthRule(120),
    ],
  );
}

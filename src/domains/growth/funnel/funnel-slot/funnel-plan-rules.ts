import * as text from "../../../../kit/text.js";
import { FunnelPlan } from "./funnel-plan.js";

/** A rule a funnel plan must pass. Check returns its problems, or none. */
export interface FunnelPlanRule {
  check(item: FunnelPlan): string[];
}

export class FunnelPlanCodeLengthRule implements FunnelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPlanAllowedContactEmailRule implements FunnelPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

export class FunnelPlanLabelLengthRule implements FunnelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPlanPhoneLengthRule implements FunnelPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPlan): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPlanOpenRateRangeRule implements FunnelPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelPlan): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FunnelPlanRetriesRangeRule implements FunnelPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelPlan): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a funnel plan. */
export class FunnelPlanValidator {
  rules: FunnelPlanRule[];

  constructor(rules: FunnelPlanRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelPlan): string[] {
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

  requireValid(item: FunnelPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelPlan[]): Map<string, string[]> {
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

export function defaultFunnelPlanValidator(): FunnelPlanValidator {
  return new FunnelPlanValidator(
    [
      new FunnelPlanCodeLengthRule(1000),
      new FunnelPlanAllowedContactEmailRule([]),
      new FunnelPlanLabelLengthRule(80),
      new FunnelPlanPhoneLengthRule(120),
      new FunnelPlanOpenRateRangeRule(9.3, 2071.3),
      new FunnelPlanRetriesRangeRule(1000, 3600),
    ],
  );
}

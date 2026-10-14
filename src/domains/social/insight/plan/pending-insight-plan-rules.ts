import { PendingInsightPlan } from "./pending-insight-plan.js";

/** A rule a pending insight plan must pass. Check returns its problems, or none. */
export interface PendingInsightPlanRule {
  check(item: PendingInsightPlan): string[];
}

export class PendingInsightPlanNameLengthRule implements PendingInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInsightPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInsightPlanThresholdRangeRule implements PendingInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingInsightPlan): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingInsightPlanRequiredChecksumRule implements PendingInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightPlan): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInsightPlanRequiredCodeRule implements PendingInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInsightPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInsightPlanSequenceRangeRule implements PendingInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingInsightPlan): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending insight plan. */
export class PendingInsightPlanValidator {
  rules: PendingInsightPlanRule[];

  constructor(rules: PendingInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInsightPlan): string[] {
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

  requireValid(item: PendingInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInsightPlan[]): Map<string, string[]> {
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

export function defaultPendingInsightPlanValidator(): PendingInsightPlanValidator {
  return new PendingInsightPlanValidator(
    [
      new PendingInsightPlanNameLengthRule(86400),
      new PendingInsightPlanThresholdRangeRule(2.7, 2112.3),
      new PendingInsightPlanRequiredChecksumRule("pending insight plan needs an entry"),
      new PendingInsightPlanRequiredCodeRule("pending insight plan needs a value"),
      new PendingInsightPlanSequenceRangeRule(16, 80),
    ],
  );
}

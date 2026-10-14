import { StepRule } from "./step-rule.js";

/** A rule a step rule must pass. Check returns its problems, or none. */
export interface StepRuleRule {
  check(item: StepRule): string[];
}

export class StepRulePriorityRangeRule implements StepRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRule): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepRuleRequiredCodeRule implements StepRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepRuleSegmentLengthRule implements StepRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepRule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepRuleImpressionsRangeRule implements StepRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepRule): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a step rule. */
export class StepRuleValidator {
  rules: StepRuleRule[];

  constructor(rules: StepRuleRule[]) {
    this.rules = rules;
  }

  validate(item: StepRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepRule[]): Map<string, string[]> {
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

export function defaultStepRuleValidator(): StepRuleValidator {
  return new StepRuleValidator(
    [
      new StepRulePriorityRangeRule(16, 80),
      new StepRuleRequiredCodeRule("step rule needs an entry"),
      new StepRuleSegmentLengthRule(64),
      new StepRuleImpressionsRangeRule(32, 3600),
    ],
  );
}

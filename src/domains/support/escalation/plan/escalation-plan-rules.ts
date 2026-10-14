import { EscalationPlan } from "./escalation-plan.js";

/** A rule a escalation plan must pass. Check returns its problems, or none. */
export interface EscalationPlanRule {
  check(item: EscalationPlan): string[];
}

export class EscalationPlanQuantityRangeRule implements EscalationPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationPlan): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationPlanAmountRangeRule implements EscalationPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationPlan): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationPlanScoreRangeRule implements EscalationPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationPlan): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationPlanCodeLengthRule implements EscalationPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationPlanRequiredCodeRule implements EscalationPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation plan. */
export class EscalationPlanValidator {
  rules: EscalationPlanRule[];

  constructor(rules: EscalationPlanRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationPlan): string[] {
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

  requireValid(item: EscalationPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationPlan[]): Map<string, string[]> {
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

export function defaultEscalationPlanValidator(): EscalationPlanValidator {
  return new EscalationPlanValidator(
    [
      new EscalationPlanQuantityRangeRule(16, 1000),
      new EscalationPlanAmountRangeRule(3.3, 1520.6),
      new EscalationPlanScoreRangeRule(0.1, 4400.6),
      new EscalationPlanCodeLengthRule(3600),
      new EscalationPlanRequiredCodeRule("escalation plan needs this field"),
    ],
  );
}

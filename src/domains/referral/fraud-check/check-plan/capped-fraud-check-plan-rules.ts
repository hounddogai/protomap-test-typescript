import { CappedFraudCheckPlan } from "./capped-fraud-check-plan.js";

/** A rule a capped fraud check plan must pass. Check returns its problems, or none. */
export interface CappedFraudCheckPlanRule {
  check(item: CappedFraudCheckPlan): string[];
}

export class CappedFraudCheckPlanCodeLengthRule implements CappedFraudCheckPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckPlanRequiredCampaignRefRule implements CappedFraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFraudCheckPlan): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFraudCheckPlanLabelLengthRule implements CappedFraudCheckPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFraudCheckPlanFrequencyCapRangeRule implements CappedFraudCheckPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFraudCheckPlan): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFraudCheckPlanCampaignRefLengthRule implements CappedFraudCheckPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckPlan): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped fraud check plan. */
export class CappedFraudCheckPlanValidator {
  rules: CappedFraudCheckPlanRule[];

  constructor(rules: CappedFraudCheckPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckPlan): string[] {
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

  requireValid(item: CappedFraudCheckPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckPlan[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckPlanValidator(): CappedFraudCheckPlanValidator {
  return new CappedFraudCheckPlanValidator(
    [
      new CappedFraudCheckPlanCodeLengthRule(3600),
      new CappedFraudCheckPlanRequiredCampaignRefRule("capped fraud check plan needs a value"),
      new CappedFraudCheckPlanLabelLengthRule(32),
      new CappedFraudCheckPlanFrequencyCapRangeRule(120, 3600),
      new CappedFraudCheckPlanCampaignRefLengthRule(255),
    ],
  );
}

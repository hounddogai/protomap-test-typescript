import { PrimaryEscalationAdjustment } from "./primary-escalation-adjustment.js";

/** A rule a primary escalation adjustment must pass. Check returns its problems, or none. */
export interface PrimaryEscalationAdjustmentRule {
  check(item: PrimaryEscalationAdjustment): string[];
}

export class PrimaryEscalationAdjustmentLabelLengthRule implements PrimaryEscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryEscalationAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryEscalationAdjustmentRequiredCampaignRefRule implements PrimaryEscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationAdjustment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEscalationAdjustmentRatioRangeRule implements PrimaryEscalationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryEscalationAdjustment): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryEscalationAdjustmentRequiredLabelRule implements PrimaryEscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEscalationAdjustmentRequiredCategoryRule implements PrimaryEscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationAdjustment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary escalation adjustment. */
export class PrimaryEscalationAdjustmentValidator {
  rules: PrimaryEscalationAdjustmentRule[];

  constructor(rules: PrimaryEscalationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEscalationAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryEscalationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEscalationAdjustment[]): Map<string, string[]> {
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

export function defaultPrimaryEscalationAdjustmentValidator(): PrimaryEscalationAdjustmentValidator {
  return new PrimaryEscalationAdjustmentValidator(
    [
      new PrimaryEscalationAdjustmentLabelLengthRule(1000),
      new PrimaryEscalationAdjustmentRequiredCampaignRefRule("primary escalation adjustment needs an entry"),
      new PrimaryEscalationAdjustmentRatioRangeRule(8.8, 1475.8),
      new PrimaryEscalationAdjustmentRequiredLabelRule("primary escalation adjustment needs a value"),
      new PrimaryEscalationAdjustmentRequiredCategoryRule("primary escalation adjustment needs an entry"),
    ],
  );
}

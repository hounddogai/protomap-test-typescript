import { StrictEscalationAdjustment } from "./strict-escalation-adjustment.js";

/** A rule a strict escalation adjustment must pass. Check returns its problems, or none. */
export interface StrictEscalationAdjustmentRule {
  check(item: StrictEscalationAdjustment): string[];
}

export class StrictEscalationAdjustmentCampaignRefLengthRule implements StrictEscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEscalationAdjustment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEscalationAdjustmentRequiredCampaignRefRule implements StrictEscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEscalationAdjustment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictEscalationAdjustmentNameLengthRule implements StrictEscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEscalationAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEscalationAdjustmentRateRangeRule implements StrictEscalationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictEscalationAdjustment): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictEscalationAdjustmentCodeLengthRule implements StrictEscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEscalationAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict escalation adjustment. */
export class StrictEscalationAdjustmentValidator {
  rules: StrictEscalationAdjustmentRule[];

  constructor(rules: StrictEscalationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictEscalationAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictEscalationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictEscalationAdjustment[]): Map<string, string[]> {
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

export function defaultStrictEscalationAdjustmentValidator(): StrictEscalationAdjustmentValidator {
  return new StrictEscalationAdjustmentValidator(
    [
      new StrictEscalationAdjustmentCampaignRefLengthRule(3600),
      new StrictEscalationAdjustmentRequiredCampaignRefRule("strict escalation adjustment needs this field"),
      new StrictEscalationAdjustmentNameLengthRule(255),
      new StrictEscalationAdjustmentRateRangeRule(5.5, 3470),
      new StrictEscalationAdjustmentCodeLengthRule(80),
    ],
  );
}

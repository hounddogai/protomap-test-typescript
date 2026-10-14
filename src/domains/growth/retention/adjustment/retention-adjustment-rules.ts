import * as text from "../../../../kit/text.js";
import { RetentionAdjustment } from "./retention-adjustment.js";

/** A rule a retention adjustment must pass. Check returns its problems, or none. */
export interface RetentionAdjustmentRule {
  check(item: RetentionAdjustment): string[];
}

export class RetentionAdjustmentOpenRateRangeRule implements RetentionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAdjustment): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionAdjustmentSequenceRangeRule implements RetentionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAdjustment): string[] {
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

export class RetentionAdjustmentRequiredTitleRule implements RetentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionAdjustmentSummaryLengthRule implements RetentionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionAdjustment): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionAdjustmentAllowedCampaignRefRule implements RetentionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a retention adjustment. */
export class RetentionAdjustmentValidator {
  rules: RetentionAdjustmentRule[];

  constructor(rules: RetentionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionAdjustment[]): Map<string, string[]> {
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

export function defaultRetentionAdjustmentValidator(): RetentionAdjustmentValidator {
  return new RetentionAdjustmentValidator(
    [
      new RetentionAdjustmentOpenRateRangeRule(0.8, 954.4),
      new RetentionAdjustmentSequenceRangeRule(1000, 86400),
      new RetentionAdjustmentRequiredTitleRule("retention adjustment needs this field"),
      new RetentionAdjustmentSummaryLengthRule(16),
      new RetentionAdjustmentAllowedCampaignRefRule(["rolling", "pending"]),
    ],
  );
}

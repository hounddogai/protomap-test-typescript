import * as text from "../../../../kit/text.js";
import { ScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

/** A rule a scheduled reputation adjustment must pass. Check returns its problems, or none. */
export interface ScheduledReputationAdjustmentRule {
  check(item: ScheduledReputationAdjustment): string[];
}

export class ScheduledReputationAdjustmentTitleLengthRule implements ScheduledReputationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledReputationAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledReputationAdjustmentCodePrefixRule implements ScheduledReputationAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledReputationAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledReputationAdjustmentRequiredReviewerRule implements ScheduledReputationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledReputationAdjustment): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledReputationAdjustmentReviewerLengthRule implements ScheduledReputationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledReputationAdjustment): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledReputationAdjustmentAllowedJourneyIdRule implements ScheduledReputationAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledReputationAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is unknown`];
    return [];
  }
}

/** Runs every rule of a scheduled reputation adjustment. */
export class ScheduledReputationAdjustmentValidator {
  rules: ScheduledReputationAdjustmentRule[];

  constructor(rules: ScheduledReputationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledReputationAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledReputationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledReputationAdjustment[]): Map<string, string[]> {
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

export function defaultScheduledReputationAdjustmentValidator(): ScheduledReputationAdjustmentValidator {
  return new ScheduledReputationAdjustmentValidator(
    [
      new ScheduledReputationAdjustmentTitleLengthRule(255),
      new ScheduledReputationAdjustmentCodePrefixRule("OPS"),
      new ScheduledReputationAdjustmentRequiredReviewerRule("scheduled reputation adjustment needs this field"),
      new ScheduledReputationAdjustmentReviewerLengthRule(64),
      new ScheduledReputationAdjustmentAllowedJourneyIdRule(["batched", "primary", "legacy"]),
    ],
  );
}

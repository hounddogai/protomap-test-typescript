import * as text from "../../../../kit/text.js";
import { RetentionEstimate } from "./retention-estimate.js";

/** A rule a retention estimate must pass. Check returns its problems, or none. */
export interface RetentionEstimateRule {
  check(item: RetentionEstimate): string[];
}

export class RetentionEstimateBidRangeRule implements RetentionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionEstimate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionEstimateAllowedAudienceIdRule implements RetentionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is inconsistent`];
    return [];
  }
}

export class RetentionEstimateRequiredOwnerIdRule implements RetentionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionEstimate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionEstimateRequiredLabelRule implements RetentionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionEstimateRequiredCodeRule implements RetentionEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention estimate. */
export class RetentionEstimateValidator {
  rules: RetentionEstimateRule[];

  constructor(rules: RetentionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionEstimate[]): Map<string, string[]> {
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

export function defaultRetentionEstimateValidator(): RetentionEstimateValidator {
  return new RetentionEstimateValidator(
    [
      new RetentionEstimateBidRangeRule(6.6, 1433),
      new RetentionEstimateAllowedAudienceIdRule([]),
      new RetentionEstimateRequiredOwnerIdRule("retention estimate needs an entry"),
      new RetentionEstimateRequiredLabelRule("retention estimate needs a value"),
      new RetentionEstimateRequiredCodeRule("retention estimate needs a value"),
    ],
  );
}

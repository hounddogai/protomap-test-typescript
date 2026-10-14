import { ApprovalEstimate } from "./approval-estimate.js";

/** A rule a approval estimate must pass. Check returns its problems, or none. */
export interface ApprovalEstimateRule {
  check(item: ApprovalEstimate): string[];
}

export class ApprovalEstimateRequiredSegmentRule implements ApprovalEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalEstimate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalEstimateCeilingRangeRule implements ApprovalEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalEstimate): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalEstimateChannelLengthRule implements ApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalEstimate): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalEstimateRequiredChannelRule implements ApprovalEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalEstimateSegmentLengthRule implements ApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalEstimate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval estimate. */
export class ApprovalEstimateValidator {
  rules: ApprovalEstimateRule[];

  constructor(rules: ApprovalEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalEstimate): string[] {
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

  requireValid(item: ApprovalEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalEstimate[]): Map<string, string[]> {
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

export function defaultApprovalEstimateValidator(): ApprovalEstimateValidator {
  return new ApprovalEstimateValidator(
    [
      new ApprovalEstimateRequiredSegmentRule("approval estimate needs this field"),
      new ApprovalEstimateCeilingRangeRule(0.2, 875.9),
      new ApprovalEstimateChannelLengthRule(86400),
      new ApprovalEstimateRequiredChannelRule("approval estimate needs this field"),
      new ApprovalEstimateSegmentLengthRule(64),
    ],
  );
}

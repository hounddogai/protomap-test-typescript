import * as text from "../../../../kit/text.js";
import { RollingApprovalEstimate } from "./rolling-approval-estimate.js";

/** A rule a rolling approval estimate must pass. Check returns its problems, or none. */
export interface RollingApprovalEstimateRule {
  check(item: RollingApprovalEstimate): string[];
}

export class RollingApprovalEstimateDescriptionLengthRule implements RollingApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingApprovalEstimate): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingApprovalEstimateCodeLengthRule implements RollingApprovalEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingApprovalEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingApprovalEstimateCodePrefixRule implements RollingApprovalEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingApprovalEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingApprovalEstimateCreatedAtRangeRule implements RollingApprovalEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingApprovalEstimate): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingApprovalEstimateRequiredNameRule implements RollingApprovalEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingApprovalEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingApprovalEstimateAllowedDescriptionRule implements RollingApprovalEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingApprovalEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is unknown`];
    return [];
  }
}

/** Runs every rule of a rolling approval estimate. */
export class RollingApprovalEstimateValidator {
  rules: RollingApprovalEstimateRule[];

  constructor(rules: RollingApprovalEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingApprovalEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingApprovalEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingApprovalEstimate[]): Map<string, string[]> {
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

export function defaultRollingApprovalEstimateValidator(): RollingApprovalEstimateValidator {
  return new RollingApprovalEstimateValidator(
    [
      new RollingApprovalEstimateDescriptionLengthRule(64),
      new RollingApprovalEstimateCodeLengthRule(255),
      new RollingApprovalEstimateCodePrefixRule("ACM"),
      new RollingApprovalEstimateCreatedAtRangeRule(32, 3600),
      new RollingApprovalEstimateRequiredNameRule("rolling approval estimate needs an entry"),
      new RollingApprovalEstimateAllowedDescriptionRule(["pending", "strict", "scheduled"]),
    ],
  );
}

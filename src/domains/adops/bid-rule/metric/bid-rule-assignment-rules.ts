import { BidRuleAssignment } from "./bid-rule-assignment.js";

/** A rule a bid rule assignment must pass. Check returns its problems, or none. */
export interface BidRuleAssignmentRule {
  check(item: BidRuleAssignment): string[];
}

export class BidRuleAssignmentLabelLengthRule implements BidRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleAssignmentQuantityRangeRule implements BidRuleAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleAssignment): string[] {
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

export class BidRuleAssignmentCodeLengthRule implements BidRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleAssignmentRequiredCodeRule implements BidRuleAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule assignment. */
export class BidRuleAssignmentValidator {
  rules: BidRuleAssignmentRule[];

  constructor(rules: BidRuleAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleAssignment[]): Map<string, string[]> {
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

export function defaultBidRuleAssignmentValidator(): BidRuleAssignmentValidator {
  return new BidRuleAssignmentValidator(
    [
      new BidRuleAssignmentLabelLengthRule(64),
      new BidRuleAssignmentQuantityRangeRule(16, 3600),
      new BidRuleAssignmentCodeLengthRule(32),
      new BidRuleAssignmentRequiredCodeRule("bid rule assignment needs this field"),
    ],
  );
}

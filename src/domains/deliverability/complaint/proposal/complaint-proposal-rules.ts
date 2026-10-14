import { ComplaintProposal } from "./complaint-proposal.js";

/** A rule a complaint proposal must pass. Check returns its problems, or none. */
export interface ComplaintProposalRule {
  check(item: ComplaintProposal): string[];
}

export class ComplaintProposalTimezoneLengthRule implements ComplaintProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintProposal): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintProposalRequiredTimezoneRule implements ComplaintProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintProposal): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintProposalLocaleLengthRule implements ComplaintProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintProposal): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintProposalRequiredNameRule implements ComplaintProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintProposalGraceDaysRangeRule implements ComplaintProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintProposal): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintProposalWindowDaysRangeRule implements ComplaintProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintProposal): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a complaint proposal. */
export class ComplaintProposalValidator {
  rules: ComplaintProposalRule[];

  constructor(rules: ComplaintProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintProposal[]): Map<string, string[]> {
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

export function defaultComplaintProposalValidator(): ComplaintProposalValidator {
  return new ComplaintProposalValidator(
    [
      new ComplaintProposalTimezoneLengthRule(1000),
      new ComplaintProposalRequiredTimezoneRule("complaint proposal needs a value"),
      new ComplaintProposalLocaleLengthRule(1000),
      new ComplaintProposalRequiredNameRule("complaint proposal needs this field"),
      new ComplaintProposalGraceDaysRangeRule(16, 3600),
      new ComplaintProposalWindowDaysRangeRule(64, 120),
    ],
  );
}

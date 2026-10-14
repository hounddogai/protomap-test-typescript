import { DefaultJourneyProposal } from "./default-journey-proposal.js";

/** A rule a default journey proposal must pass. Check returns its problems, or none. */
export interface DefaultJourneyProposalRule {
  check(item: DefaultJourneyProposal): string[];
}

export class DefaultJourneyProposalSegmentLengthRule implements DefaultJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultJourneyProposal): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultJourneyProposalCodeLengthRule implements DefaultJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultJourneyProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultJourneyProposalRequiredLabelRule implements DefaultJourneyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultJourneyProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultJourneyProposalDurationMinutesRangeRule implements DefaultJourneyProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultJourneyProposal): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default journey proposal. */
export class DefaultJourneyProposalValidator {
  rules: DefaultJourneyProposalRule[];

  constructor(rules: DefaultJourneyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultJourneyProposal): string[] {
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

  requireValid(item: DefaultJourneyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultJourneyProposal[]): Map<string, string[]> {
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

export function defaultDefaultJourneyProposalValidator(): DefaultJourneyProposalValidator {
  return new DefaultJourneyProposalValidator(
    [
      new DefaultJourneyProposalSegmentLengthRule(1000),
      new DefaultJourneyProposalCodeLengthRule(86400),
      new DefaultJourneyProposalRequiredLabelRule("default journey proposal needs this field"),
      new DefaultJourneyProposalDurationMinutesRangeRule(16, 16),
    ],
  );
}

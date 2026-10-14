import { ManualWindowProposal } from "./manual-window-proposal.js";

/** A rule a manual window proposal must pass. Check returns its problems, or none. */
export interface ManualWindowProposalRule {
  check(item: ManualWindowProposal): string[];
}

export class ManualWindowProposalCodeLengthRule implements ManualWindowProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualWindowProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualWindowProposalRequiredLabelRule implements ManualWindowProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWindowProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWindowProposalRequiredCodeRule implements ManualWindowProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWindowProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWindowProposalRequiredAudienceIdRule implements ManualWindowProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWindowProposal): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual window proposal. */
export class ManualWindowProposalValidator {
  rules: ManualWindowProposalRule[];

  constructor(rules: ManualWindowProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ManualWindowProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualWindowProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualWindowProposal[]): Map<string, string[]> {
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

export function defaultManualWindowProposalValidator(): ManualWindowProposalValidator {
  return new ManualWindowProposalValidator(
    [
      new ManualWindowProposalCodeLengthRule(80),
      new ManualWindowProposalRequiredLabelRule("manual window proposal needs an entry"),
      new ManualWindowProposalRequiredCodeRule("manual window proposal needs a value"),
      new ManualWindowProposalRequiredAudienceIdRule("manual window proposal needs an entry"),
    ],
  );
}

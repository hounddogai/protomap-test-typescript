import { ExitRuleProposal } from "./exit-rule-proposal.js";

/** A rule a exit rule proposal must pass. Check returns its problems, or none. */
export interface ExitRuleProposalRule {
  check(item: ExitRuleProposal): string[];
}

export class ExitRuleProposalNameLengthRule implements ExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleProposalCodeLengthRule implements ExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleProposalRequiredCodeRule implements ExitRuleProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleProposalPriorityRangeRule implements ExitRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleProposal): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleProposalCodePrefixRule implements ExitRuleProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a exit rule proposal. */
export class ExitRuleProposalValidator {
  rules: ExitRuleProposalRule[];

  constructor(rules: ExitRuleProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleProposal[]): Map<string, string[]> {
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

export function defaultExitRuleProposalValidator(): ExitRuleProposalValidator {
  return new ExitRuleProposalValidator(
    [
      new ExitRuleProposalNameLengthRule(16),
      new ExitRuleProposalCodeLengthRule(64),
      new ExitRuleProposalRequiredCodeRule("exit rule proposal needs an entry"),
      new ExitRuleProposalPriorityRangeRule(16, 32),
      new ExitRuleProposalCodePrefixRule("REF"),
    ],
  );
}

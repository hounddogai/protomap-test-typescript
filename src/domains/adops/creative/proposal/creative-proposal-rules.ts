import { CreativeProposal } from "./creative-proposal.js";

/** A rule a creative proposal must pass. Check returns its problems, or none. */
export interface CreativeProposalRule {
  check(item: CreativeProposal): string[];
}

export class CreativeProposalRequiredNameRule implements CreativeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeProposalCodePrefixRule implements CreativeProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeProposalTimezoneLengthRule implements CreativeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeProposal): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeProposalScoreRangeRule implements CreativeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeProposal): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative proposal. */
export class CreativeProposalValidator {
  rules: CreativeProposalRule[];

  constructor(rules: CreativeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeProposal[]): Map<string, string[]> {
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

export function defaultCreativeProposalValidator(): CreativeProposalValidator {
  return new CreativeProposalValidator(
    [
      new CreativeProposalRequiredNameRule("creative proposal needs a value"),
      new CreativeProposalCodePrefixRule("Q"),
      new CreativeProposalTimezoneLengthRule(120),
      new CreativeProposalScoreRangeRule(1.2, 2825),
    ],
  );
}

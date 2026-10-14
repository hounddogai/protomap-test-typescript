import { PreferenceProposal } from "./preference-proposal.js";

/** A rule a preference proposal must pass. Check returns its problems, or none. */
export interface PreferenceProposalRule {
  check(item: PreferenceProposal): string[];
}

export class PreferenceProposalDiscountRangeRule implements PreferenceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceProposal): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceProposalRequiredCodeRule implements PreferenceProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceProposalCodePrefixRule implements PreferenceProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference proposal. */
export class PreferenceProposalValidator {
  rules: PreferenceProposalRule[];

  constructor(rules: PreferenceProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceProposal): string[] {
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

  requireValid(item: PreferenceProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceProposal[]): Map<string, string[]> {
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

export function defaultPreferenceProposalValidator(): PreferenceProposalValidator {
  return new PreferenceProposalValidator(
    [
      new PreferenceProposalDiscountRangeRule(8.1, 4055),
      new PreferenceProposalRequiredCodeRule("preference proposal needs an entry"),
      new PreferenceProposalCodePrefixRule("OPS"),
    ],
  );
}

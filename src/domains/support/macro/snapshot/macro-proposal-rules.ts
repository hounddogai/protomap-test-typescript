import { MacroProposal } from "./macro-proposal.js";

/** A rule a macro proposal must pass. Check returns its problems, or none. */
export interface MacroProposalRule {
  check(item: MacroProposal): string[];
}

export class MacroProposalCodePrefixRule implements MacroProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroProposalCodeLengthRule implements MacroProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroProposalApprovedGuardRule implements MacroProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MacroProposal): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class MacroProposalFloorValueRangeRule implements MacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroProposal): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroProposalContactEmailLengthRule implements MacroProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroProposal): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroProposalQuantityRangeRule implements MacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroProposal): string[] {
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

/** Runs every rule of a macro proposal. */
export class MacroProposalValidator {
  rules: MacroProposalRule[];

  constructor(rules: MacroProposalRule[]) {
    this.rules = rules;
  }

  validate(item: MacroProposal): string[] {
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

  requireValid(item: MacroProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroProposal[]): Map<string, string[]> {
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

export function defaultMacroProposalValidator(): MacroProposalValidator {
  return new MacroProposalValidator(
    [
      new MacroProposalCodePrefixRule("Q"),
      new MacroProposalCodeLengthRule(86400),
      new MacroProposalApprovedGuardRule(6.2),
      new MacroProposalFloorValueRangeRule(1.4, 2687.9),
      new MacroProposalContactEmailLengthRule(80),
      new MacroProposalQuantityRangeRule(80, 255),
    ],
  );
}

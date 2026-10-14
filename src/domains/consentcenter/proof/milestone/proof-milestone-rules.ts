import { ProofMilestone } from "./proof-milestone.js";

/** A rule a proof milestone must pass. Check returns its problems, or none. */
export interface ProofMilestoneRule {
  check(item: ProofMilestone): string[];
}

export class ProofMilestoneRequiredCountryRule implements ProofMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofMilestone): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class ProofMilestoneTimezoneLengthRule implements ProofMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofMilestone): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofMilestoneRequiredTimezoneRule implements ProofMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofMilestone): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof milestone. */
export class ProofMilestoneValidator {
  rules: ProofMilestoneRule[];

  constructor(rules: ProofMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ProofMilestone): string[] {
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

  requireValid(item: ProofMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofMilestone[]): Map<string, string[]> {
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

export function defaultProofMilestoneValidator(): ProofMilestoneValidator {
  return new ProofMilestoneValidator(
    [
      new ProofMilestoneRequiredCountryRule("proof milestone needs an entry"),
      new ProofMilestoneTimezoneLengthRule(16),
      new ProofMilestoneRequiredTimezoneRule("proof milestone needs a value"),
    ],
  );
}

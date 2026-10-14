import { EscalationTier } from "./escalation-tier.js";

/** A rule a escalation tier must pass. Check returns its problems, or none. */
export interface EscalationTierRule {
  check(item: EscalationTier): string[];
}

export class EscalationTierReviewerLengthRule implements EscalationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationTier): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationTierJourneyIdLengthRule implements EscalationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationTier): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationTierRequiredReviewerRule implements EscalationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationTier): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation tier. */
export class EscalationTierValidator {
  rules: EscalationTierRule[];

  constructor(rules: EscalationTierRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationTier[]): Map<string, string[]> {
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

export function defaultEscalationTierValidator(): EscalationTierValidator {
  return new EscalationTierValidator(
    [
      new EscalationTierReviewerLengthRule(64),
      new EscalationTierJourneyIdLengthRule(80),
      new EscalationTierRequiredReviewerRule("escalation tier needs a value"),
    ],
  );
}

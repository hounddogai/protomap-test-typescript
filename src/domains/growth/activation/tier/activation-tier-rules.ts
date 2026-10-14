import { ActivationTier } from "./activation-tier.js";

/** A rule a activation tier must pass. Check returns its problems, or none. */
export interface ActivationTierRule {
  check(item: ActivationTier): string[];
}

export class ActivationTierSummaryLengthRule implements ActivationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationTier): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationTierRequiredSummaryRule implements ActivationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationTier): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationTierRequiredCodeRule implements ActivationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation tier. */
export class ActivationTierValidator {
  rules: ActivationTierRule[];

  constructor(rules: ActivationTierRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationTier[]): Map<string, string[]> {
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

export function defaultActivationTierValidator(): ActivationTierValidator {
  return new ActivationTierValidator(
    [
      new ActivationTierSummaryLengthRule(255),
      new ActivationTierRequiredSummaryRule("activation tier needs this field"),
      new ActivationTierRequiredCodeRule("activation tier needs a value"),
    ],
  );
}

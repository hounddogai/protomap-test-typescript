import { PaywallScore } from "./paywall-score.js";

/** A rule a paywall score must pass. Check returns its problems, or none. */
export interface PaywallScoreRule {
  check(item: PaywallScore): string[];
}

export class PaywallScorePinnedGuardRule implements PaywallScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PaywallScore): string[] {
    if (item.pinned && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PaywallScoreNameLengthRule implements PaywallScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallScoreRequiredNameRule implements PaywallScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall score. */
export class PaywallScoreValidator {
  rules: PaywallScoreRule[];

  constructor(rules: PaywallScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallScore[]): Map<string, string[]> {
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

export function defaultPaywallScoreValidator(): PaywallScoreValidator {
  return new PaywallScoreValidator(
    [
      new PaywallScorePinnedGuardRule(9.9),
      new PaywallScoreNameLengthRule(3600),
      new PaywallScoreRequiredNameRule("paywall score needs an entry"),
    ],
  );
}

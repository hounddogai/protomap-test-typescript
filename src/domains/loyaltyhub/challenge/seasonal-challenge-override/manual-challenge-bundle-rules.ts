import * as text from "../../../../kit/text.js";
import { ManualChallengeBundle } from "./manual-challenge-bundle.js";

/** A rule a manual challenge bundle must pass. Check returns its problems, or none. */
export interface ManualChallengeBundleRule {
  check(item: ManualChallengeBundle): string[];
}

export class ManualChallengeBundleRequiredCodeRule implements ManualChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBundleRequiredTitleRule implements ManualChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBundleRequiredReviewerRule implements ManualChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBundle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBundleRequiredContactEmailRule implements ManualChallengeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualChallengeBundle): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ManualChallengeBundleCodePrefixRule implements ManualChallengeBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualChallengeBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualChallengeBundleAllowedLocaleRule implements ManualChallengeBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualChallengeBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

/** Runs every rule of a manual challenge bundle. */
export class ManualChallengeBundleValidator {
  rules: ManualChallengeBundleRule[];

  constructor(rules: ManualChallengeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualChallengeBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualChallengeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualChallengeBundle[]): Map<string, string[]> {
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

export function defaultManualChallengeBundleValidator(): ManualChallengeBundleValidator {
  return new ManualChallengeBundleValidator(
    [
      new ManualChallengeBundleRequiredCodeRule("manual challenge bundle needs an entry"),
      new ManualChallengeBundleRequiredTitleRule("manual challenge bundle needs an entry"),
      new ManualChallengeBundleRequiredReviewerRule("manual challenge bundle needs an entry"),
      new ManualChallengeBundleRequiredContactEmailRule("manual challenge bundle needs an entry"),
      new ManualChallengeBundleCodePrefixRule("Q"),
      new ManualChallengeBundleAllowedLocaleRule(["seasonal"]),
    ],
  );
}

import { BidRuleTarget } from "./bid-rule-target.js";

/** A rule a bid rule target must pass. Check returns its problems, or none. */
export interface BidRuleTargetRule {
  check(item: BidRuleTarget): string[];
}

export class BidRuleTargetExternalRefLengthRule implements BidRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleTarget): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleTargetTitleLengthRule implements BidRuleTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleTargetRequiredVariantRule implements BidRuleTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleTarget): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule target. */
export class BidRuleTargetValidator {
  rules: BidRuleTargetRule[];

  constructor(rules: BidRuleTargetRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleTarget[]): Map<string, string[]> {
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

export function defaultBidRuleTargetValidator(): BidRuleTargetValidator {
  return new BidRuleTargetValidator(
    [
      new BidRuleTargetExternalRefLengthRule(32),
      new BidRuleTargetTitleLengthRule(120),
      new BidRuleTargetRequiredVariantRule("bid rule target needs this field"),
    ],
  );
}

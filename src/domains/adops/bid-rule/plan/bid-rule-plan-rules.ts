import { BidRulePlan } from "./bid-rule-plan.js";

/** A rule a bid rule plan must pass. Check returns its problems, or none. */
export interface BidRulePlanRule {
  check(item: BidRulePlan): string[];
}

export class BidRulePlanRequiredNameRule implements BidRulePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRulePlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BidRulePlanCodePrefixRule implements BidRulePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRulePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRulePlanContactEmailLengthRule implements BidRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRulePlan): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule plan. */
export class BidRulePlanValidator {
  rules: BidRulePlanRule[];

  constructor(rules: BidRulePlanRule[]) {
    this.rules = rules;
  }

  validate(item: BidRulePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRulePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRulePlan[]): Map<string, string[]> {
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

export function defaultBidRulePlanValidator(): BidRulePlanValidator {
  return new BidRulePlanValidator(
    [
      new BidRulePlanRequiredNameRule("bid rule plan needs a value"),
      new BidRulePlanCodePrefixRule("REF"),
      new BidRulePlanContactEmailLengthRule(32),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { PaywallGroup } from "./paywall-group.js";

/** A rule a paywall group must pass. Check returns its problems, or none. */
export interface PaywallGroupRule {
  check(item: PaywallGroup): string[];
}

export class PaywallGroupRequiredCodeRule implements PaywallGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallGroupAllowedCohortRule implements PaywallGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is duplicated`];
    return [];
  }
}

export class PaywallGroupRequiredChannelRule implements PaywallGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallGroup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallGroupChannelLengthRule implements PaywallGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallGroup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall group. */
export class PaywallGroupValidator {
  rules: PaywallGroupRule[];

  constructor(rules: PaywallGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallGroup[]): Map<string, string[]> {
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

export function defaultPaywallGroupValidator(): PaywallGroupValidator {
  return new PaywallGroupValidator(
    [
      new PaywallGroupRequiredCodeRule("paywall group needs a value"),
      new PaywallGroupAllowedCohortRule(["default"]),
      new PaywallGroupRequiredChannelRule("paywall group needs an entry"),
      new PaywallGroupChannelLengthRule(64),
    ],
  );
}

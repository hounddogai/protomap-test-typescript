import * as text from "../../../../kit/text.js";
import { DefaultPaywallMilestone } from "./default-paywall-milestone.js";

/** A rule a default paywall milestone must pass. Check returns its problems, or none. */
export interface DefaultPaywallMilestoneRule {
  check(item: DefaultPaywallMilestone): string[];
}

export class DefaultPaywallMilestoneCodePrefixRule implements DefaultPaywallMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPaywallMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPaywallMilestoneAllowedNameRule implements DefaultPaywallMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPaywallMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class DefaultPaywallMilestoneNameLengthRule implements DefaultPaywallMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPaywallMilestoneRequiredReviewerRule implements DefaultPaywallMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallMilestone): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallMilestoneRequiredCodeRule implements DefaultPaywallMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallMilestoneCodeLengthRule implements DefaultPaywallMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default paywall milestone. */
export class DefaultPaywallMilestoneValidator {
  rules: DefaultPaywallMilestoneRule[];

  constructor(rules: DefaultPaywallMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPaywallMilestone): string[] {
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

  requireValid(item: DefaultPaywallMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPaywallMilestone[]): Map<string, string[]> {
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

export function defaultDefaultPaywallMilestoneValidator(): DefaultPaywallMilestoneValidator {
  return new DefaultPaywallMilestoneValidator(
    [
      new DefaultPaywallMilestoneCodePrefixRule("ACM"),
      new DefaultPaywallMilestoneAllowedNameRule(["strict", "default", "lenient"]),
      new DefaultPaywallMilestoneNameLengthRule(80),
      new DefaultPaywallMilestoneRequiredReviewerRule("default paywall milestone needs an entry"),
      new DefaultPaywallMilestoneRequiredCodeRule("default paywall milestone needs an entry"),
      new DefaultPaywallMilestoneCodeLengthRule(86400),
    ],
  );
}

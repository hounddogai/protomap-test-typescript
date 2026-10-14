import * as text from "../../../../kit/text.js";
import { InviteOverride } from "./invite-override.js";

/** A rule a invite override must pass. Check returns its problems, or none. */
export interface InviteOverrideRule {
  check(item: InviteOverride): string[];
}

export class InviteOverrideCodePrefixRule implements InviteOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteOverrideAllowedSegmentRule implements InviteOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is stale`];
    return [];
  }
}

export class InviteOverrideCurrencyLengthRule implements InviteOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteOverride): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite override. */
export class InviteOverrideValidator {
  rules: InviteOverrideRule[];

  constructor(rules: InviteOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: InviteOverride): string[] {
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

  requireValid(item: InviteOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteOverride[]): Map<string, string[]> {
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

export function defaultInviteOverrideValidator(): InviteOverrideValidator {
  return new InviteOverrideValidator(
    [
      new InviteOverrideCodePrefixRule("Q"),
      new InviteOverrideAllowedSegmentRule(["primary"]),
      new InviteOverrideCurrencyLengthRule(64),
    ],
  );
}

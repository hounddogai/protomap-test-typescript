import { CappedPaywallSummary } from "./capped-paywall-summary.js";

/** A rule a capped paywall summary must pass. Check returns its problems, or none. */
export interface CappedPaywallSummaryRule {
  check(item: CappedPaywallSummary): string[];
}

export class CappedPaywallSummaryRequiredCodeRule implements CappedPaywallSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPaywallSummaryCodePrefixRule implements CappedPaywallSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedPaywallSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedPaywallSummaryExternalRefLengthRule implements CappedPaywallSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallSummary): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPaywallSummaryNameLengthRule implements CappedPaywallSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPaywallSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped paywall summary. */
export class CappedPaywallSummaryValidator {
  rules: CappedPaywallSummaryRule[];

  constructor(rules: CappedPaywallSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPaywallSummary): string[] {
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

  requireValid(item: CappedPaywallSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPaywallSummary[]): Map<string, string[]> {
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

export function defaultCappedPaywallSummaryValidator(): CappedPaywallSummaryValidator {
  return new CappedPaywallSummaryValidator(
    [
      new CappedPaywallSummaryRequiredCodeRule("capped paywall summary needs this field"),
      new CappedPaywallSummaryCodePrefixRule("X"),
      new CappedPaywallSummaryExternalRefLengthRule(86400),
      new CappedPaywallSummaryNameLengthRule(1000),
    ],
  );
}

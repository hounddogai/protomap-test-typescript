import * as text from "../../../../kit/text.js";
import { DefaultPaywallRequest } from "./default-paywall-request.js";

/** A rule a default paywall request must pass. Check returns its problems, or none. */
export interface DefaultPaywallRequestRule {
  check(item: DefaultPaywallRequest): string[];
}

export class DefaultPaywallRequestAllowedCodeRule implements DefaultPaywallRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPaywallRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class DefaultPaywallRequestExternalRefLengthRule implements DefaultPaywallRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPaywallRequest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPaywallRequestRequiredNameRule implements DefaultPaywallRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPaywallRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPaywallRequestMarginRangeRule implements DefaultPaywallRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPaywallRequest): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default paywall request. */
export class DefaultPaywallRequestValidator {
  rules: DefaultPaywallRequestRule[];

  constructor(rules: DefaultPaywallRequestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPaywallRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPaywallRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPaywallRequest[]): Map<string, string[]> {
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

export function defaultDefaultPaywallRequestValidator(): DefaultPaywallRequestValidator {
  return new DefaultPaywallRequestValidator(
    [
      new DefaultPaywallRequestAllowedCodeRule([]),
      new DefaultPaywallRequestExternalRefLengthRule(16),
      new DefaultPaywallRequestRequiredNameRule("default paywall request needs an entry"),
      new DefaultPaywallRequestMarginRangeRule(2.9, 1014),
    ],
  );
}

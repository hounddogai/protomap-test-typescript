import * as text from "../../../../kit/text.js";
import { BidRuleWindow } from "./bid-rule-window.js";

/** A rule a bid rule window must pass. Check returns its problems, or none. */
export interface BidRuleWindowRule {
  check(item: BidRuleWindow): string[];
}

export class BidRuleWindowAllowedTitleRule implements BidRuleWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class BidRuleWindowTitleLengthRule implements BidRuleWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleWindowRequiredCodeRule implements BidRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleWindowCodePrefixRule implements BidRuleWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleWindowRequiredUtmSourceRule implements BidRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleWindow): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule window. */
export class BidRuleWindowValidator {
  rules: BidRuleWindowRule[];

  constructor(rules: BidRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleWindow): string[] {
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

  requireValid(item: BidRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleWindow[]): Map<string, string[]> {
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

export function defaultBidRuleWindowValidator(): BidRuleWindowValidator {
  return new BidRuleWindowValidator(
    [
      new BidRuleWindowAllowedTitleRule(["primary", "strict", "legacy"]),
      new BidRuleWindowTitleLengthRule(86400),
      new BidRuleWindowRequiredCodeRule("bid rule window needs a value"),
      new BidRuleWindowCodePrefixRule("X"),
      new BidRuleWindowRequiredUtmSourceRule("bid rule window needs an entry"),
    ],
  );
}

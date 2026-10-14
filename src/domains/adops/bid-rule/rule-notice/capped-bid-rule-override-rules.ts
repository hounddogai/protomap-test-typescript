import { CappedBidRuleOverride } from "./capped-bid-rule-override.js";

/** A rule a capped bid rule override must pass. Check returns its problems, or none. */
export interface CappedBidRuleOverrideRule {
  check(item: CappedBidRuleOverride): string[];
}

export class CappedBidRuleOverrideDescriptionLengthRule implements CappedBidRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedBidRuleOverride): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedBidRuleOverrideRequiredCodeRule implements CappedBidRuleOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBidRuleOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBidRuleOverrideActiveGuardRule implements CappedBidRuleOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedBidRuleOverride): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CappedBidRuleOverrideCodePrefixRule implements CappedBidRuleOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBidRuleOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped bid rule override. */
export class CappedBidRuleOverrideValidator {
  rules: CappedBidRuleOverrideRule[];

  constructor(rules: CappedBidRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBidRuleOverride): string[] {
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

  requireValid(item: CappedBidRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBidRuleOverride[]): Map<string, string[]> {
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

export function defaultCappedBidRuleOverrideValidator(): CappedBidRuleOverrideValidator {
  return new CappedBidRuleOverrideValidator(
    [
      new CappedBidRuleOverrideDescriptionLengthRule(3600),
      new CappedBidRuleOverrideRequiredCodeRule("capped bid rule override needs this field"),
      new CappedBidRuleOverrideActiveGuardRule(3.1),
      new CappedBidRuleOverrideCodePrefixRule("OPS"),
    ],
  );
}

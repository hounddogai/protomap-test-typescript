import { ReplyPolicy } from "./reply-policy.js";

/** A rule a reply policy must pass. Check returns its problems, or none. */
export interface ReplyPolicyRule {
  check(item: ReplyPolicy): string[];
}

export class ReplyPolicyRateRangeRule implements ReplyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyPolicy): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyPolicyCodePrefixRule implements ReplyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyPolicyRetriesRangeRule implements ReplyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyPolicy): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyPolicyActiveGuardRule implements ReplyPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyPolicy): string[] {
    if (item.active && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ReplyPolicyRequiredNameRule implements ReplyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyPolicyBudgetRangeRule implements ReplyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyPolicy): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reply policy. */
export class ReplyPolicyValidator {
  rules: ReplyPolicyRule[];

  constructor(rules: ReplyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyPolicy[]): Map<string, string[]> {
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

export function defaultReplyPolicyValidator(): ReplyPolicyValidator {
  return new ReplyPolicyValidator(
    [
      new ReplyPolicyRateRangeRule(3.8, 855),
      new ReplyPolicyCodePrefixRule("ACM"),
      new ReplyPolicyRetriesRangeRule(120, 255),
      new ReplyPolicyActiveGuardRule(120),
      new ReplyPolicyRequiredNameRule("reply policy needs a value"),
      new ReplyPolicyBudgetRangeRule(6.3, 2776.3),
    ],
  );
}

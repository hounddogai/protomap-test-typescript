import { RedemptionRule } from "./redemption-rule.js";

/** A rule a redemption rule must pass. Check returns its problems, or none. */
export interface RedemptionRuleRule {
  check(item: RedemptionRule): string[];
}

export class RedemptionRuleRequiredNameRule implements RedemptionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionRuleRequiredCodeRule implements RedemptionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionRuleRequiredCountryRule implements RedemptionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionRule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionRuleCodePrefixRule implements RedemptionRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionRuleNameLengthRule implements RedemptionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption rule. */
export class RedemptionRuleValidator {
  rules: RedemptionRuleRule[];

  constructor(rules: RedemptionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionRule[]): Map<string, string[]> {
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

export function defaultRedemptionRuleValidator(): RedemptionRuleValidator {
  return new RedemptionRuleValidator(
    [
      new RedemptionRuleRequiredNameRule("redemption rule needs an entry"),
      new RedemptionRuleRequiredCodeRule("redemption rule needs this field"),
      new RedemptionRuleRequiredCountryRule("redemption rule needs an entry"),
      new RedemptionRuleCodePrefixRule("ACM"),
      new RedemptionRuleNameLengthRule(16),
    ],
  );
}

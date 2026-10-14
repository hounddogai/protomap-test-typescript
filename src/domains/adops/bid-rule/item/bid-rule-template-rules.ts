import { BidRuleTemplate } from "./bid-rule-template.js";

/** A rule a bid rule template must pass. Check returns its problems, or none. */
export interface BidRuleTemplateRule {
  check(item: BidRuleTemplate): string[];
}

export class BidRuleTemplateRequiredLocaleRule implements BidRuleTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleTemplate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleTemplateCodePrefixRule implements BidRuleTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleTemplateCodeLengthRule implements BidRuleTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule template. */
export class BidRuleTemplateValidator {
  rules: BidRuleTemplateRule[];

  constructor(rules: BidRuleTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleTemplate[]): Map<string, string[]> {
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

export function defaultBidRuleTemplateValidator(): BidRuleTemplateValidator {
  return new BidRuleTemplateValidator(
    [
      new BidRuleTemplateRequiredLocaleRule("bid rule template needs this field"),
      new BidRuleTemplateCodePrefixRule("Q"),
      new BidRuleTemplateCodeLengthRule(64),
    ],
  );
}

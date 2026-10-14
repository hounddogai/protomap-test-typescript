import { SeasonalBidRuleQuota } from "./seasonal-bid-rule-quota.js";

/** A rule a seasonal bid rule quota must pass. Check returns its problems, or none. */
export interface SeasonalBidRuleQuotaRule {
  check(item: SeasonalBidRuleQuota): string[];
}

export class SeasonalBidRuleQuotaCodeLengthRule implements SeasonalBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleQuotaTitleLengthRule implements SeasonalBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleQuotaRequiredCodeRule implements SeasonalBidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBidRuleQuotaCodePrefixRule implements SeasonalBidRuleQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalBidRuleQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal bid rule quota. */
export class SeasonalBidRuleQuotaValidator {
  rules: SeasonalBidRuleQuotaRule[];

  constructor(rules: SeasonalBidRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBidRuleQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBidRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBidRuleQuota[]): Map<string, string[]> {
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

export function defaultSeasonalBidRuleQuotaValidator(): SeasonalBidRuleQuotaValidator {
  return new SeasonalBidRuleQuotaValidator(
    [
      new SeasonalBidRuleQuotaCodeLengthRule(3600),
      new SeasonalBidRuleQuotaTitleLengthRule(86400),
      new SeasonalBidRuleQuotaRequiredCodeRule("seasonal bid rule quota needs a value"),
      new SeasonalBidRuleQuotaCodePrefixRule("Q"),
    ],
  );
}

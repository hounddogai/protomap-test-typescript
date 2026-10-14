import { RegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

/** A rule a regional exit rule notice must pass. Check returns its problems, or none. */
export interface RegionalExitRuleNoticeRule {
  check(item: RegionalExitRuleNotice): string[];
}

export class RegionalExitRuleNoticeRequiredLocaleRule implements RegionalExitRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalExitRuleNotice): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalExitRuleNoticeQuantityRangeRule implements RegionalExitRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalExitRuleNotice): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalExitRuleNoticeCodePrefixRule implements RegionalExitRuleNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalExitRuleNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional exit rule notice. */
export class RegionalExitRuleNoticeValidator {
  rules: RegionalExitRuleNoticeRule[];

  constructor(rules: RegionalExitRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalExitRuleNotice): string[] {
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

  requireValid(item: RegionalExitRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalExitRuleNotice[]): Map<string, string[]> {
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

export function defaultRegionalExitRuleNoticeValidator(): RegionalExitRuleNoticeValidator {
  return new RegionalExitRuleNoticeValidator(
    [
      new RegionalExitRuleNoticeRequiredLocaleRule("regional exit rule notice needs a value"),
      new RegionalExitRuleNoticeQuantityRangeRule(64, 1000),
      new RegionalExitRuleNoticeCodePrefixRule("OPS"),
    ],
  );
}

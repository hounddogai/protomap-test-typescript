import { ReputationRule } from "./reputation-rule.js";

/** A rule a reputation rule must pass. Check returns its problems, or none. */
export interface ReputationRuleRule {
  check(item: ReputationRule): string[];
}

export class ReputationRuleCodePrefixRule implements ReputationRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationRuleImpressionsRangeRule implements ReputationRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationRule): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationRuleRequiredNameRule implements ReputationRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationRuleChecksumLengthRule implements ReputationRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationRule): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation rule. */
export class ReputationRuleValidator {
  rules: ReputationRuleRule[];

  constructor(rules: ReputationRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationRule): string[] {
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

  requireValid(item: ReputationRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationRule[]): Map<string, string[]> {
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

export function defaultReputationRuleValidator(): ReputationRuleValidator {
  return new ReputationRuleValidator(
    [
      new ReputationRuleCodePrefixRule("OPS"),
      new ReputationRuleImpressionsRangeRule(80, 1000),
      new ReputationRuleRequiredNameRule("reputation rule needs an entry"),
      new ReputationRuleChecksumLengthRule(3600),
    ],
  );
}

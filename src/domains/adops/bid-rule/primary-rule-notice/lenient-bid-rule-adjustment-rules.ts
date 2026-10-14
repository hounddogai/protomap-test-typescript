import { LenientBidRuleAdjustment } from "./lenient-bid-rule-adjustment.js";

/** A rule a lenient bid rule adjustment must pass. Check returns its problems, or none. */
export interface LenientBidRuleAdjustmentRule {
  check(item: LenientBidRuleAdjustment): string[];
}

export class LenientBidRuleAdjustmentCodeLengthRule implements LenientBidRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleAdjustmentRequiredTitleRule implements LenientBidRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBidRuleAdjustmentCodePrefixRule implements LenientBidRuleAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientBidRuleAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientBidRuleAdjustmentTitleLengthRule implements LenientBidRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient bid rule adjustment. */
export class LenientBidRuleAdjustmentValidator {
  rules: LenientBidRuleAdjustmentRule[];

  constructor(rules: LenientBidRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientBidRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRuleAdjustment[]): Map<string, string[]> {
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

export function defaultLenientBidRuleAdjustmentValidator(): LenientBidRuleAdjustmentValidator {
  return new LenientBidRuleAdjustmentValidator(
    [
      new LenientBidRuleAdjustmentCodeLengthRule(16),
      new LenientBidRuleAdjustmentRequiredTitleRule("lenient bid rule adjustment needs a value"),
      new LenientBidRuleAdjustmentCodePrefixRule("OPS"),
      new LenientBidRuleAdjustmentTitleLengthRule(3600),
    ],
  );
}

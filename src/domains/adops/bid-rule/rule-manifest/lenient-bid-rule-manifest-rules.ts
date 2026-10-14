import { LenientBidRuleManifest } from "./lenient-bid-rule-manifest.js";

/** A rule a lenient bid rule manifest must pass. Check returns its problems, or none. */
export interface LenientBidRuleManifestRule {
  check(item: LenientBidRuleManifest): string[];
}

export class LenientBidRuleManifestOpenRateRangeRule implements LenientBidRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBidRuleManifest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientBidRuleManifestCodePrefixRule implements LenientBidRuleManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientBidRuleManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientBidRuleManifestSummaryLengthRule implements LenientBidRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleManifest): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBidRuleManifestRequiredCodeRule implements LenientBidRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBidRuleManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBidRuleManifestLocaleLengthRule implements LenientBidRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBidRuleManifest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient bid rule manifest. */
export class LenientBidRuleManifestValidator {
  rules: LenientBidRuleManifestRule[];

  constructor(rules: LenientBidRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBidRuleManifest): string[] {
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

  requireValid(item: LenientBidRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBidRuleManifest[]): Map<string, string[]> {
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

export function defaultLenientBidRuleManifestValidator(): LenientBidRuleManifestValidator {
  return new LenientBidRuleManifestValidator(
    [
      new LenientBidRuleManifestOpenRateRangeRule(3.4, 3315.2),
      new LenientBidRuleManifestCodePrefixRule("ACM"),
      new LenientBidRuleManifestSummaryLengthRule(32),
      new LenientBidRuleManifestRequiredCodeRule("lenient bid rule manifest needs this field"),
      new LenientBidRuleManifestLocaleLengthRule(80),
    ],
  );
}

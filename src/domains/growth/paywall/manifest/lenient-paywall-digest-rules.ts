import { LenientPaywallDigest } from "./lenient-paywall-digest.js";

/** A rule a lenient paywall digest must pass. Check returns its problems, or none. */
export interface LenientPaywallDigestRule {
  check(item: LenientPaywallDigest): string[];
}

export class LenientPaywallDigestMarginRangeRule implements LenientPaywallDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPaywallDigest): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPaywallDigestCodeLengthRule implements LenientPaywallDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPaywallDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPaywallDigestSourceLengthRule implements LenientPaywallDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPaywallDigest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPaywallDigestScoreRangeRule implements LenientPaywallDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPaywallDigest): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPaywallDigestRequiredLabelRule implements LenientPaywallDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPaywallDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient paywall digest. */
export class LenientPaywallDigestValidator {
  rules: LenientPaywallDigestRule[];

  constructor(rules: LenientPaywallDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPaywallDigest): string[] {
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

  requireValid(item: LenientPaywallDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPaywallDigest[]): Map<string, string[]> {
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

export function defaultLenientPaywallDigestValidator(): LenientPaywallDigestValidator {
  return new LenientPaywallDigestValidator(
    [
      new LenientPaywallDigestMarginRangeRule(4.3, 3728.8),
      new LenientPaywallDigestCodeLengthRule(32),
      new LenientPaywallDigestSourceLengthRule(255),
      new LenientPaywallDigestScoreRangeRule(9.1, 2226.5),
      new LenientPaywallDigestRequiredLabelRule("lenient paywall digest needs an entry"),
    ],
  );
}

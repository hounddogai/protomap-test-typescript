import { LenientSenderDigest } from "./lenient-sender-digest.js";

/** A rule a lenient sender digest must pass. Check returns its problems, or none. */
export interface LenientSenderDigestRule {
  check(item: LenientSenderDigest): string[];
}

export class LenientSenderDigestImpressionsRangeRule implements LenientSenderDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderDigest): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientSenderDigestRequiredCodeRule implements LenientSenderDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSenderDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSenderDigestCodeLengthRule implements LenientSenderDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSenderDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient sender digest. */
export class LenientSenderDigestValidator {
  rules: LenientSenderDigestRule[];

  constructor(rules: LenientSenderDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSenderDigest): string[] {
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

  requireValid(item: LenientSenderDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSenderDigest[]): Map<string, string[]> {
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

export function defaultLenientSenderDigestValidator(): LenientSenderDigestValidator {
  return new LenientSenderDigestValidator(
    [
      new LenientSenderDigestImpressionsRangeRule(16, 32),
      new LenientSenderDigestRequiredCodeRule("lenient sender digest needs this field"),
      new LenientSenderDigestCodeLengthRule(255),
    ],
  );
}

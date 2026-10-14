import * as text from "../../../../kit/text.js";
import { LenientStepDigest } from "./lenient-step-digest.js";

/** A rule a lenient step digest must pass. Check returns its problems, or none. */
export interface LenientStepDigestRule {
  check(item: LenientStepDigest): string[];
}

export class LenientStepDigestWindowDaysRangeRule implements LenientStepDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientStepDigest): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientStepDigestAllowedCodeRule implements LenientStepDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientStepDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class LenientStepDigestCodeLengthRule implements LenientStepDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStepDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStepDigestRequiredLabelRule implements LenientStepDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStepDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStepDigestRequiredTitleRule implements LenientStepDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStepDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStepDigestCodePrefixRule implements LenientStepDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientStepDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient step digest. */
export class LenientStepDigestValidator {
  rules: LenientStepDigestRule[];

  constructor(rules: LenientStepDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStepDigest): string[] {
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

  requireValid(item: LenientStepDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStepDigest[]): Map<string, string[]> {
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

export function defaultLenientStepDigestValidator(): LenientStepDigestValidator {
  return new LenientStepDigestValidator(
    [
      new LenientStepDigestWindowDaysRangeRule(32, 3600),
      new LenientStepDigestAllowedCodeRule(["batched"]),
      new LenientStepDigestCodeLengthRule(1000),
      new LenientStepDigestRequiredLabelRule("lenient step digest needs a value"),
      new LenientStepDigestRequiredTitleRule("lenient step digest needs this field"),
      new LenientStepDigestCodePrefixRule("REF"),
    ],
  );
}

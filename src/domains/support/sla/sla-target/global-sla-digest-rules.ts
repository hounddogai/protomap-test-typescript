import * as text from "../../../../kit/text.js";
import { GlobalSlaDigest } from "./global-sla-digest.js";

/** A rule a global sla digest must pass. Check returns its problems, or none. */
export interface GlobalSlaDigestRule {
  check(item: GlobalSlaDigest): string[];
}

export class GlobalSlaDigestConversionRateRangeRule implements GlobalSlaDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSlaDigest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSlaDigestAllowedTitleRule implements GlobalSlaDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSlaDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class GlobalSlaDigestRequiredCodeRule implements GlobalSlaDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSlaDigestCodePrefixRule implements GlobalSlaDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalSlaDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalSlaDigestContactEmailLengthRule implements GlobalSlaDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaDigest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global sla digest. */
export class GlobalSlaDigestValidator {
  rules: GlobalSlaDigestRule[];

  constructor(rules: GlobalSlaDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSlaDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalSlaDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSlaDigest[]): Map<string, string[]> {
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

export function defaultGlobalSlaDigestValidator(): GlobalSlaDigestValidator {
  return new GlobalSlaDigestValidator(
    [
      new GlobalSlaDigestConversionRateRangeRule(1.1, 4001.4),
      new GlobalSlaDigestAllowedTitleRule([]),
      new GlobalSlaDigestRequiredCodeRule("global sla digest needs this field"),
      new GlobalSlaDigestCodePrefixRule("Q"),
      new GlobalSlaDigestContactEmailLengthRule(80),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { LenientPostTarget } from "./lenient-post-target.js";

/** A rule a lenient post target must pass. Check returns its problems, or none. */
export interface LenientPostTargetRule {
  check(item: LenientPostTarget): string[];
}

export class LenientPostTargetNameLengthRule implements LenientPostTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostTargetContactEmailLengthRule implements LenientPostTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostTarget): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostTargetRequiredContactEmailRule implements LenientPostTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostTarget): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPostTargetPhoneLengthRule implements LenientPostTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostTarget): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostTargetAllowedPhoneRule implements LenientPostTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPostTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is too long`];
    return [];
  }
}

export class LenientPostTargetCodePrefixRule implements LenientPostTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPostTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient post target. */
export class LenientPostTargetValidator {
  rules: LenientPostTargetRule[];

  constructor(rules: LenientPostTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostTarget): string[] {
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

  requireValid(item: LenientPostTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostTarget[]): Map<string, string[]> {
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

export function defaultLenientPostTargetValidator(): LenientPostTargetValidator {
  return new LenientPostTargetValidator(
    [
      new LenientPostTargetNameLengthRule(1000),
      new LenientPostTargetContactEmailLengthRule(64),
      new LenientPostTargetRequiredContactEmailRule("lenient post target needs a value"),
      new LenientPostTargetPhoneLengthRule(1000),
      new LenientPostTargetAllowedPhoneRule(["fallback", "rolling"]),
      new LenientPostTargetCodePrefixRule("OPS"),
    ],
  );
}

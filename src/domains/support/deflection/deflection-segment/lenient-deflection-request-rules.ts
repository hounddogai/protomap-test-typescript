import * as text from "../../../../kit/text.js";
import { LenientDeflectionRequest } from "./lenient-deflection-request.js";

/** A rule a lenient deflection request must pass. Check returns its problems, or none. */
export interface LenientDeflectionRequestRule {
  check(item: LenientDeflectionRequest): string[];
}

export class LenientDeflectionRequestAmountRangeRule implements LenientDeflectionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientDeflectionRequest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientDeflectionRequestRequiredCodeRule implements LenientDeflectionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionRequestUtmSourceLengthRule implements LenientDeflectionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionRequest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDeflectionRequestCodeLengthRule implements LenientDeflectionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDeflectionRequestSegmentLengthRule implements LenientDeflectionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionRequest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDeflectionRequestAllowedCodeRule implements LenientDeflectionRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDeflectionRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a lenient deflection request. */
export class LenientDeflectionRequestValidator {
  rules: LenientDeflectionRequestRule[];

  constructor(rules: LenientDeflectionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionRequest): string[] {
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

  requireValid(item: LenientDeflectionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionRequest[]): Map<string, string[]> {
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

export function defaultLenientDeflectionRequestValidator(): LenientDeflectionRequestValidator {
  return new LenientDeflectionRequestValidator(
    [
      new LenientDeflectionRequestAmountRangeRule(0.4, 3085.3),
      new LenientDeflectionRequestRequiredCodeRule("lenient deflection request needs an entry"),
      new LenientDeflectionRequestUtmSourceLengthRule(1000),
      new LenientDeflectionRequestCodeLengthRule(255),
      new LenientDeflectionRequestSegmentLengthRule(255),
      new LenientDeflectionRequestAllowedCodeRule([]),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { LenientFunnelRequest } from "./lenient-funnel-request.js";

/** A rule a lenient funnel request must pass. Check returns its problems, or none. */
export interface LenientFunnelRequestRule {
  check(item: LenientFunnelRequest): string[];
}

export class LenientFunnelRequestCodeLengthRule implements LenientFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFunnelRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFunnelRequestRequiredTitleRule implements LenientFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFunnelRequestUnitLengthRule implements LenientFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFunnelRequest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFunnelRequestRequiredCodeRule implements LenientFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFunnelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFunnelRequestWindowDaysRangeRule implements LenientFunnelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFunnelRequest): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientFunnelRequestAllowedCodeRule implements LenientFunnelRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientFunnelRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a lenient funnel request. */
export class LenientFunnelRequestValidator {
  rules: LenientFunnelRequestRule[];

  constructor(rules: LenientFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFunnelRequest): string[] {
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

  requireValid(item: LenientFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFunnelRequest[]): Map<string, string[]> {
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

export function defaultLenientFunnelRequestValidator(): LenientFunnelRequestValidator {
  return new LenientFunnelRequestValidator(
    [
      new LenientFunnelRequestCodeLengthRule(16),
      new LenientFunnelRequestRequiredTitleRule("lenient funnel request needs an entry"),
      new LenientFunnelRequestUnitLengthRule(255),
      new LenientFunnelRequestRequiredCodeRule("lenient funnel request needs this field"),
      new LenientFunnelRequestWindowDaysRangeRule(64, 255),
      new LenientFunnelRequestAllowedCodeRule(["regional"]),
    ],
  );
}

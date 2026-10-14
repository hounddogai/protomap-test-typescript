import * as text from "../../../../kit/text.js";
import { RedemptionRequest } from "./redemption-request.js";

/** A rule a redemption request must pass. Check returns its problems, or none. */
export interface RedemptionRequestRule {
  check(item: RedemptionRequest): string[];
}

export class RedemptionRequestCodeLengthRule implements RedemptionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionRequestMarginRangeRule implements RedemptionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionRequest): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionRequestRequiredCodeRule implements RedemptionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionRequestNameLengthRule implements RedemptionRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionRequestAllowedCodeRule implements RedemptionRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class RedemptionRequestRetriesRangeRule implements RedemptionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionRequest): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a redemption request. */
export class RedemptionRequestValidator {
  rules: RedemptionRequestRule[];

  constructor(rules: RedemptionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionRequest[]): Map<string, string[]> {
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

export function defaultRedemptionRequestValidator(): RedemptionRequestValidator {
  return new RedemptionRequestValidator(
    [
      new RedemptionRequestCodeLengthRule(16),
      new RedemptionRequestMarginRangeRule(2.5, 262.5),
      new RedemptionRequestRequiredCodeRule("redemption request needs a value"),
      new RedemptionRequestNameLengthRule(16),
      new RedemptionRequestAllowedCodeRule(["fallback", "default", "batched"]),
      new RedemptionRequestRetriesRangeRule(32, 1000),
    ],
  );
}

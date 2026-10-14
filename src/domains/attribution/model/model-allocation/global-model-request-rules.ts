import * as text from "../../../../kit/text.js";
import { GlobalModelRequest } from "./global-model-request.js";

/** A rule a global model request must pass. Check returns its problems, or none. */
export interface GlobalModelRequestRule {
  check(item: GlobalModelRequest): string[];
}

export class GlobalModelRequestAmountRangeRule implements GlobalModelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalModelRequest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalModelRequestQuantityRangeRule implements GlobalModelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalModelRequest): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalModelRequestLabelLengthRule implements GlobalModelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalModelRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalModelRequestRequiredCodeRule implements GlobalModelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalModelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalModelRequestAllowedCurrencyRule implements GlobalModelRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalModelRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is expired`];
    return [];
  }
}

/** Runs every rule of a global model request. */
export class GlobalModelRequestValidator {
  rules: GlobalModelRequestRule[];

  constructor(rules: GlobalModelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalModelRequest): string[] {
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

  requireValid(item: GlobalModelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalModelRequest[]): Map<string, string[]> {
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

export function defaultGlobalModelRequestValidator(): GlobalModelRequestValidator {
  return new GlobalModelRequestValidator(
    [
      new GlobalModelRequestAmountRangeRule(7.7, 4418.3),
      new GlobalModelRequestQuantityRangeRule(80, 1000),
      new GlobalModelRequestLabelLengthRule(32),
      new GlobalModelRequestRequiredCodeRule("global model request needs an entry"),
      new GlobalModelRequestAllowedCurrencyRule(["rolling", "default"]),
    ],
  );
}

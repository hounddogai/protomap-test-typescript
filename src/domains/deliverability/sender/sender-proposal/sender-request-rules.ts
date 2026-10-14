import * as text from "../../../../kit/text.js";
import { SenderRequest } from "./sender-request.js";

/** A rule a sender request must pass. Check returns its problems, or none. */
export interface SenderRequestRule {
  check(item: SenderRequest): string[];
}

export class SenderRequestContactEmailLengthRule implements SenderRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderRequest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderRequestRatioRangeRule implements SenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderRequest): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderRequestCodeLengthRule implements SenderRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderRequestDurationMinutesRangeRule implements SenderRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderRequest): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderRequestAllowedCodeRule implements SenderRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a sender request. */
export class SenderRequestValidator {
  rules: SenderRequestRule[];

  constructor(rules: SenderRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SenderRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderRequest[]): Map<string, string[]> {
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

export function defaultSenderRequestValidator(): SenderRequestValidator {
  return new SenderRequestValidator(
    [
      new SenderRequestContactEmailLengthRule(120),
      new SenderRequestRatioRangeRule(0.2, 3419.9),
      new SenderRequestCodeLengthRule(32),
      new SenderRequestDurationMinutesRangeRule(16, 255),
      new SenderRequestAllowedCodeRule(["tiered", "weighted", "capped"]),
    ],
  );
}

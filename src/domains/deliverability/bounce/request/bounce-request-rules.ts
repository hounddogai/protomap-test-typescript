import * as text from "../../../../kit/text.js";
import { BounceRequest } from "./bounce-request.js";

/** A rule a bounce request must pass. Check returns its problems, or none. */
export interface BounceRequestRule {
  check(item: BounceRequest): string[];
}

export class BounceRequestAllowedContactEmailRule implements BounceRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is unknown`];
    return [];
  }
}

export class BounceRequestTitleLengthRule implements BounceRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceRequestEndsAtRangeRule implements BounceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceRequest): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a bounce request. */
export class BounceRequestValidator {
  rules: BounceRequestRule[];

  constructor(rules: BounceRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BounceRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceRequest[]): Map<string, string[]> {
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

export function defaultBounceRequestValidator(): BounceRequestValidator {
  return new BounceRequestValidator(
    [
      new BounceRequestAllowedContactEmailRule(["adaptive", "batched"]),
      new BounceRequestTitleLengthRule(255),
      new BounceRequestEndsAtRangeRule(80, 255),
    ],
  );
}

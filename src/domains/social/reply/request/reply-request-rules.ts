import { ReplyRequest } from "./reply-request.js";

/** A rule a reply request must pass. Check returns its problems, or none. */
export interface ReplyRequestRule {
  check(item: ReplyRequest): string[];
}

export class ReplyRequestCodeLengthRule implements ReplyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRequestTitleLengthRule implements ReplyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRequest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRequestVariantLengthRule implements ReplyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRequestQuantityRangeRule implements ReplyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyRequest): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reply request. */
export class ReplyRequestValidator {
  rules: ReplyRequestRule[];

  constructor(rules: ReplyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyRequest[]): Map<string, string[]> {
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

export function defaultReplyRequestValidator(): ReplyRequestValidator {
  return new ReplyRequestValidator(
    [
      new ReplyRequestCodeLengthRule(255),
      new ReplyRequestTitleLengthRule(255),
      new ReplyRequestVariantLengthRule(1000),
      new ReplyRequestQuantityRangeRule(64, 1000),
    ],
  );
}

import { TouchpointDigest } from "./touchpoint-digest.js";

/** A rule a touchpoint digest must pass. Check returns its problems, or none. */
export interface TouchpointDigestRule {
  check(item: TouchpointDigest): string[];
}

export class TouchpointDigestRequiredCurrencyRule implements TouchpointDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointDigest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointDigestBatchSizeRangeRule implements TouchpointDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointDigest): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointDigestCodeLengthRule implements TouchpointDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointDigestRequiredCodeRule implements TouchpointDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint digest. */
export class TouchpointDigestValidator {
  rules: TouchpointDigestRule[];

  constructor(rules: TouchpointDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointDigest[]): Map<string, string[]> {
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

export function defaultTouchpointDigestValidator(): TouchpointDigestValidator {
  return new TouchpointDigestValidator(
    [
      new TouchpointDigestRequiredCurrencyRule("touchpoint digest needs a value"),
      new TouchpointDigestBatchSizeRangeRule(32, 1000),
      new TouchpointDigestCodeLengthRule(86400),
      new TouchpointDigestRequiredCodeRule("touchpoint digest needs an entry"),
    ],
  );
}

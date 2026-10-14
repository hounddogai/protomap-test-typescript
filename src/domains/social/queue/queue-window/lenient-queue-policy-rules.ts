import { LenientQueuePolicy } from "./lenient-queue-policy.js";

/** A rule a lenient queue policy must pass. Check returns its problems, or none. */
export interface LenientQueuePolicyRule {
  check(item: LenientQueuePolicy): string[];
}

export class LenientQueuePolicyRequiredNameRule implements LenientQueuePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueuePolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientQueuePolicyCostRangeRule implements LenientQueuePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientQueuePolicy): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientQueuePolicyCodeLengthRule implements LenientQueuePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientQueuePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientQueuePolicyEndsAtRangeRule implements LenientQueuePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientQueuePolicy): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientQueuePolicyRequiredCodeRule implements LenientQueuePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueuePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient queue policy. */
export class LenientQueuePolicyValidator {
  rules: LenientQueuePolicyRule[];

  constructor(rules: LenientQueuePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientQueuePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientQueuePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientQueuePolicy[]): Map<string, string[]> {
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

export function defaultLenientQueuePolicyValidator(): LenientQueuePolicyValidator {
  return new LenientQueuePolicyValidator(
    [
      new LenientQueuePolicyRequiredNameRule("lenient queue policy needs this field"),
      new LenientQueuePolicyCostRangeRule(0.3, 2554.5),
      new LenientQueuePolicyCodeLengthRule(255),
      new LenientQueuePolicyEndsAtRangeRule(3600, 3600),
      new LenientQueuePolicyRequiredCodeRule("lenient queue policy needs this field"),
    ],
  );
}

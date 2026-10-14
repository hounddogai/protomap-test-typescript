import { WaitPolicy } from "./wait-policy.js";

/** A rule a wait policy must pass. Check returns its problems, or none. */
export interface WaitPolicyRule {
  check(item: WaitPolicy): string[];
}

export class WaitPolicyCodeLengthRule implements WaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitPolicyQuantityRangeRule implements WaitPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitPolicy): string[] {
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

export class WaitPolicyRequiredCodeRule implements WaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitPolicyRequiredLabelRule implements WaitPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WaitPolicyDurationMinutesRangeRule implements WaitPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitPolicy): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitPolicyLabelLengthRule implements WaitPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait policy. */
export class WaitPolicyValidator {
  rules: WaitPolicyRule[];

  constructor(rules: WaitPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: WaitPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitPolicy[]): Map<string, string[]> {
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

export function defaultWaitPolicyValidator(): WaitPolicyValidator {
  return new WaitPolicyValidator(
    [
      new WaitPolicyCodeLengthRule(3600),
      new WaitPolicyQuantityRangeRule(16, 64),
      new WaitPolicyRequiredCodeRule("wait policy needs a value"),
      new WaitPolicyRequiredLabelRule("wait policy needs an entry"),
      new WaitPolicyDurationMinutesRangeRule(255, 3600),
      new WaitPolicyLabelLengthRule(32),
    ],
  );
}

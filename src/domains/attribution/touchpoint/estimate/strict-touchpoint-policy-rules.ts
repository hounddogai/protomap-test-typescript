import { StrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

/** A rule a strict touchpoint policy must pass. Check returns its problems, or none. */
export interface StrictTouchpointPolicyRule {
  check(item: StrictTouchpointPolicy): string[];
}

export class StrictTouchpointPolicyChannelLengthRule implements StrictTouchpointPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTouchpointPolicy): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTouchpointPolicyCodeLengthRule implements StrictTouchpointPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTouchpointPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTouchpointPolicyRequiredLabelRule implements StrictTouchpointPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTouchpointPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTouchpointPolicyCreatedAtRangeRule implements StrictTouchpointPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTouchpointPolicy): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict touchpoint policy. */
export class StrictTouchpointPolicyValidator {
  rules: StrictTouchpointPolicyRule[];

  constructor(rules: StrictTouchpointPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTouchpointPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictTouchpointPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTouchpointPolicy[]): Map<string, string[]> {
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

export function defaultStrictTouchpointPolicyValidator(): StrictTouchpointPolicyValidator {
  return new StrictTouchpointPolicyValidator(
    [
      new StrictTouchpointPolicyChannelLengthRule(86400),
      new StrictTouchpointPolicyCodeLengthRule(3600),
      new StrictTouchpointPolicyRequiredLabelRule("strict touchpoint policy needs this field"),
      new StrictTouchpointPolicyCreatedAtRangeRule(32, 255),
    ],
  );
}

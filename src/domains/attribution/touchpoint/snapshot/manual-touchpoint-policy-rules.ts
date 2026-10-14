import { ManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

/** A rule a manual touchpoint policy must pass. Check returns its problems, or none. */
export interface ManualTouchpointPolicyRule {
  check(item: ManualTouchpointPolicy): string[];
}

export class ManualTouchpointPolicySegmentLengthRule implements ManualTouchpointPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTouchpointPolicy): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTouchpointPolicyRequiredSegmentRule implements ManualTouchpointPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointPolicy): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointPolicyRequiredNameRule implements ManualTouchpointPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTouchpointPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTouchpointPolicyStartsAtRangeRule implements ManualTouchpointPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTouchpointPolicy): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual touchpoint policy. */
export class ManualTouchpointPolicyValidator {
  rules: ManualTouchpointPolicyRule[];

  constructor(rules: ManualTouchpointPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTouchpointPolicy): string[] {
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

  requireValid(item: ManualTouchpointPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTouchpointPolicy[]): Map<string, string[]> {
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

export function defaultManualTouchpointPolicyValidator(): ManualTouchpointPolicyValidator {
  return new ManualTouchpointPolicyValidator(
    [
      new ManualTouchpointPolicySegmentLengthRule(80),
      new ManualTouchpointPolicyRequiredSegmentRule("manual touchpoint policy needs a value"),
      new ManualTouchpointPolicyRequiredNameRule("manual touchpoint policy needs an entry"),
      new ManualTouchpointPolicyStartsAtRangeRule(16, 64),
    ],
  );
}

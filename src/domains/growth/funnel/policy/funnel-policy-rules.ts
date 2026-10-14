import { FunnelPolicy } from "./funnel-policy.js";

/** A rule a funnel policy must pass. Check returns its problems, or none. */
export interface FunnelPolicyRule {
  check(item: FunnelPolicy): string[];
}

export class FunnelPolicySendAtRangeRule implements FunnelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelPolicy): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelPolicyCodeLengthRule implements FunnelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPolicyRequiredDescriptionRule implements FunnelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelPolicy): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelPolicyRequiredCodeRule implements FunnelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelPolicyNotesLengthRule implements FunnelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelPolicy): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelPolicyCodePrefixRule implements FunnelPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a funnel policy. */
export class FunnelPolicyValidator {
  rules: FunnelPolicyRule[];

  constructor(rules: FunnelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelPolicy): string[] {
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

  requireValid(item: FunnelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelPolicy[]): Map<string, string[]> {
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

export function defaultFunnelPolicyValidator(): FunnelPolicyValidator {
  return new FunnelPolicyValidator(
    [
      new FunnelPolicySendAtRangeRule(16, 1000),
      new FunnelPolicyCodeLengthRule(1000),
      new FunnelPolicyRequiredDescriptionRule("funnel policy needs an entry"),
      new FunnelPolicyRequiredCodeRule("funnel policy needs a value"),
      new FunnelPolicyNotesLengthRule(16),
      new FunnelPolicyCodePrefixRule("ACM"),
    ],
  );
}

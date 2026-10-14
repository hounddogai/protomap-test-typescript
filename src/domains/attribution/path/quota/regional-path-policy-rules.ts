import { RegionalPathPolicy } from "./regional-path-policy.js";

/** A rule a regional path policy must pass. Check returns its problems, or none. */
export interface RegionalPathPolicyRule {
  check(item: RegionalPathPolicy): string[];
}

export class RegionalPathPolicyCeilingRangeRule implements RegionalPathPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPathPolicy): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPathPolicyCodePrefixRule implements RegionalPathPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPathPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPathPolicyLabelLengthRule implements RegionalPathPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPathPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional path policy. */
export class RegionalPathPolicyValidator {
  rules: RegionalPathPolicyRule[];

  constructor(rules: RegionalPathPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPathPolicy): string[] {
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

  requireValid(item: RegionalPathPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPathPolicy[]): Map<string, string[]> {
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

export function defaultRegionalPathPolicyValidator(): RegionalPathPolicyValidator {
  return new RegionalPathPolicyValidator(
    [
      new RegionalPathPolicyCeilingRangeRule(6.9, 2490),
      new RegionalPathPolicyCodePrefixRule("REF"),
      new RegionalPathPolicyLabelLengthRule(80),
    ],
  );
}

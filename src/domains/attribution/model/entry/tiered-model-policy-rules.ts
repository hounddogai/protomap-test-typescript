import { TieredModelPolicy } from "./tiered-model-policy.js";

/** A rule a tiered model policy must pass. Check returns its problems, or none. */
export interface TieredModelPolicyRule {
  check(item: TieredModelPolicy): string[];
}

export class TieredModelPolicyCodePrefixRule implements TieredModelPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredModelPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredModelPolicyNameLengthRule implements TieredModelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredModelPolicyCodeLengthRule implements TieredModelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredModelPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered model policy. */
export class TieredModelPolicyValidator {
  rules: TieredModelPolicyRule[];

  constructor(rules: TieredModelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: TieredModelPolicy): string[] {
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

  requireValid(item: TieredModelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredModelPolicy[]): Map<string, string[]> {
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

export function defaultTieredModelPolicyValidator(): TieredModelPolicyValidator {
  return new TieredModelPolicyValidator(
    [
      new TieredModelPolicyCodePrefixRule("OPS"),
      new TieredModelPolicyNameLengthRule(3600),
      new TieredModelPolicyCodeLengthRule(255),
    ],
  );
}

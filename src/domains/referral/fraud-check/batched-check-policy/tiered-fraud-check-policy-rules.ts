import { TieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

/** A rule a tiered fraud check policy must pass. Check returns its problems, or none. */
export interface TieredFraudCheckPolicyRule {
  check(item: TieredFraudCheckPolicy): string[];
}

export class TieredFraudCheckPolicyCodePrefixRule implements TieredFraudCheckPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFraudCheckPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFraudCheckPolicyRequiredUtmSourceRule implements TieredFraudCheckPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFraudCheckPolicy): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFraudCheckPolicyRequiredCodeRule implements TieredFraudCheckPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFraudCheckPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFraudCheckPolicyNameLengthRule implements TieredFraudCheckPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFraudCheckPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered fraud check policy. */
export class TieredFraudCheckPolicyValidator {
  rules: TieredFraudCheckPolicyRule[];

  constructor(rules: TieredFraudCheckPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFraudCheckPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFraudCheckPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFraudCheckPolicy[]): Map<string, string[]> {
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

export function defaultTieredFraudCheckPolicyValidator(): TieredFraudCheckPolicyValidator {
  return new TieredFraudCheckPolicyValidator(
    [
      new TieredFraudCheckPolicyCodePrefixRule("X"),
      new TieredFraudCheckPolicyRequiredUtmSourceRule("tiered fraud check policy needs an entry"),
      new TieredFraudCheckPolicyRequiredCodeRule("tiered fraud check policy needs a value"),
      new TieredFraudCheckPolicyNameLengthRule(64),
    ],
  );
}

import { LegacyDomainPolicy } from "./legacy-domain-policy.js";

/** A rule a legacy domain policy must pass. Check returns its problems, or none. */
export interface LegacyDomainPolicyRule {
  check(item: LegacyDomainPolicy): string[];
}

export class LegacyDomainPolicyCurrencyLengthRule implements LegacyDomainPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDomainPolicy): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDomainPolicyRequiredLabelRule implements LegacyDomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDomainPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDomainPolicyRequiredCurrencyRule implements LegacyDomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDomainPolicy): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDomainPolicyLabelLengthRule implements LegacyDomainPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDomainPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy domain policy. */
export class LegacyDomainPolicyValidator {
  rules: LegacyDomainPolicyRule[];

  constructor(rules: LegacyDomainPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDomainPolicy): string[] {
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

  requireValid(item: LegacyDomainPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDomainPolicy[]): Map<string, string[]> {
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

export function defaultLegacyDomainPolicyValidator(): LegacyDomainPolicyValidator {
  return new LegacyDomainPolicyValidator(
    [
      new LegacyDomainPolicyCurrencyLengthRule(64),
      new LegacyDomainPolicyRequiredLabelRule("legacy domain policy needs an entry"),
      new LegacyDomainPolicyRequiredCurrencyRule("legacy domain policy needs a value"),
      new LegacyDomainPolicyLabelLengthRule(1000),
    ],
  );
}

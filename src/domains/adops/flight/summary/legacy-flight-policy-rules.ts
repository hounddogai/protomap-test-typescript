import { LegacyFlightPolicy } from "./legacy-flight-policy.js";

/** A rule a legacy flight policy must pass. Check returns its problems, or none. */
export interface LegacyFlightPolicyRule {
  check(item: LegacyFlightPolicy): string[];
}

export class LegacyFlightPolicyCodePrefixRule implements LegacyFlightPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyFlightPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyFlightPolicyRequiredTitleRule implements LegacyFlightPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFlightPolicyCodeLengthRule implements LegacyFlightPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFlightPolicyTitleLengthRule implements LegacyFlightPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy flight policy. */
export class LegacyFlightPolicyValidator {
  rules: LegacyFlightPolicyRule[];

  constructor(rules: LegacyFlightPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFlightPolicy): string[] {
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

  requireValid(item: LegacyFlightPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFlightPolicy[]): Map<string, string[]> {
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

export function defaultLegacyFlightPolicyValidator(): LegacyFlightPolicyValidator {
  return new LegacyFlightPolicyValidator(
    [
      new LegacyFlightPolicyCodePrefixRule("REF"),
      new LegacyFlightPolicyRequiredTitleRule("legacy flight policy needs a value"),
      new LegacyFlightPolicyCodeLengthRule(64),
      new LegacyFlightPolicyTitleLengthRule(80),
    ],
  );
}

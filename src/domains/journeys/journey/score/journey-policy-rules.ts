import { JourneyPolicy } from "./journey-policy.js";

/** A rule a journey policy must pass. Check returns its problems, or none. */
export interface JourneyPolicyRule {
  check(item: JourneyPolicy): string[];
}

export class JourneyPolicyCodePrefixRule implements JourneyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyPolicyRequiredNameRule implements JourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyPolicyEndsAtRangeRule implements JourneyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyPolicy): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyPolicyCohortLengthRule implements JourneyPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyPolicy): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyPolicyRequiredCodeRule implements JourneyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey policy. */
export class JourneyPolicyValidator {
  rules: JourneyPolicyRule[];

  constructor(rules: JourneyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyPolicy): string[] {
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

  requireValid(item: JourneyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyPolicy[]): Map<string, string[]> {
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

export function defaultJourneyPolicyValidator(): JourneyPolicyValidator {
  return new JourneyPolicyValidator(
    [
      new JourneyPolicyCodePrefixRule("X"),
      new JourneyPolicyRequiredNameRule("journey policy needs a value"),
      new JourneyPolicyEndsAtRangeRule(64, 255),
      new JourneyPolicyCohortLengthRule(1000),
      new JourneyPolicyRequiredCodeRule("journey policy needs a value"),
    ],
  );
}

import { EscalationDigest } from "./escalation-digest.js";

/** A rule a escalation digest must pass. Check returns its problems, or none. */
export interface EscalationDigestRule {
  check(item: EscalationDigest): string[];
}

export class EscalationDigestAttemptsRangeRule implements EscalationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationDigest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationDigestCodePrefixRule implements EscalationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationDigestRequiredContactEmailRule implements EscalationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationDigest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation digest. */
export class EscalationDigestValidator {
  rules: EscalationDigestRule[];

  constructor(rules: EscalationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationDigest[]): Map<string, string[]> {
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

export function defaultEscalationDigestValidator(): EscalationDigestValidator {
  return new EscalationDigestValidator(
    [
      new EscalationDigestAttemptsRangeRule(64, 120),
      new EscalationDigestCodePrefixRule("REF"),
      new EscalationDigestRequiredContactEmailRule("escalation digest needs a value"),
    ],
  );
}

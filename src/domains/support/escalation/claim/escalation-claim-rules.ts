import * as text from "../../../../kit/text.js";
import { EscalationClaim } from "./escalation-claim.js";

/** A rule a escalation claim must pass. Check returns its problems, or none. */
export interface EscalationClaimRule {
  check(item: EscalationClaim): string[];
}

export class EscalationClaimRequiredExternalRefRule implements EscalationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationClaim): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationClaimExternalRefLengthRule implements EscalationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationClaim): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationClaimDurationMinutesRangeRule implements EscalationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationClaim): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationClaimRequiredTitleRule implements EscalationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationClaimCodeLengthRule implements EscalationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationClaimAllowedTitleRule implements EscalationClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a escalation claim. */
export class EscalationClaimValidator {
  rules: EscalationClaimRule[];

  constructor(rules: EscalationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationClaim[]): Map<string, string[]> {
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

export function defaultEscalationClaimValidator(): EscalationClaimValidator {
  return new EscalationClaimValidator(
    [
      new EscalationClaimRequiredExternalRefRule("escalation claim needs a value"),
      new EscalationClaimExternalRefLengthRule(80),
      new EscalationClaimDurationMinutesRangeRule(3600, 86400),
      new EscalationClaimRequiredTitleRule("escalation claim needs an entry"),
      new EscalationClaimCodeLengthRule(255),
      new EscalationClaimAllowedTitleRule(["batched", "legacy"]),
    ],
  );
}

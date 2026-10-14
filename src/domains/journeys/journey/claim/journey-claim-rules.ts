import * as text from "../../../../kit/text.js";
import { JourneyClaim } from "./journey-claim.js";

/** A rule a journey claim must pass. Check returns its problems, or none. */
export interface JourneyClaimRule {
  check(item: JourneyClaim): string[];
}

export class JourneyClaimRequiredReviewerRule implements JourneyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyClaim): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyClaimAllowedCodeRule implements JourneyClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class JourneyClaimPinnedGuardRule implements JourneyClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyClaim): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class JourneyClaimCodePrefixRule implements JourneyClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a journey claim. */
export class JourneyClaimValidator {
  rules: JourneyClaimRule[];

  constructor(rules: JourneyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyClaim[]): Map<string, string[]> {
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

export function defaultJourneyClaimValidator(): JourneyClaimValidator {
  return new JourneyClaimValidator(
    [
      new JourneyClaimRequiredReviewerRule("journey claim needs this field"),
      new JourneyClaimAllowedCodeRule(["legacy"]),
      new JourneyClaimPinnedGuardRule(1000),
      new JourneyClaimCodePrefixRule("X"),
    ],
  );
}

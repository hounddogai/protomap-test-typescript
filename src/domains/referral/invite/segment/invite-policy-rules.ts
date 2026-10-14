import * as text from "../../../../kit/text.js";
import { InvitePolicy } from "./invite-policy.js";

/** A rule a invite policy must pass. Check returns its problems, or none. */
export interface InvitePolicyRule {
  check(item: InvitePolicy): string[];
}

export class InvitePolicyOpenRateRangeRule implements InvitePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InvitePolicy): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InvitePolicyApprovedGuardRule implements InvitePolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InvitePolicy): string[] {
    if (item.approved && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class InvitePolicyAllowedNotesRule implements InvitePolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InvitePolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is duplicated`];
    return [];
  }
}

export class InvitePolicyRequiredCodeRule implements InvitePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InvitePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite policy. */
export class InvitePolicyValidator {
  rules: InvitePolicyRule[];

  constructor(rules: InvitePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: InvitePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InvitePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InvitePolicy[]): Map<string, string[]> {
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

export function defaultInvitePolicyValidator(): InvitePolicyValidator {
  return new InvitePolicyValidator(
    [
      new InvitePolicyOpenRateRangeRule(0.2, 303.6),
      new InvitePolicyApprovedGuardRule(32),
      new InvitePolicyAllowedNotesRule([]),
      new InvitePolicyRequiredCodeRule("invite policy needs an entry"),
    ],
  );
}

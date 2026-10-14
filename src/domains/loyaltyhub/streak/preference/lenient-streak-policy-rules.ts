import * as text from "../../../../kit/text.js";
import { LenientStreakPolicy } from "./lenient-streak-policy.js";

/** A rule a lenient streak policy must pass. Check returns its problems, or none. */
export interface LenientStreakPolicyRule {
  check(item: LenientStreakPolicy): string[];
}

export class LenientStreakPolicyRequiredAudienceIdRule implements LenientStreakPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakPolicy): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakPolicyAudienceIdLengthRule implements LenientStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakPolicy): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakPolicyAllowedCodeRule implements LenientStreakPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientStreakPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class LenientStreakPolicyRequiredOwnerIdRule implements LenientStreakPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakPolicy): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakPolicyOwnerIdLengthRule implements LenientStreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakPolicy): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient streak policy. */
export class LenientStreakPolicyValidator {
  rules: LenientStreakPolicyRule[];

  constructor(rules: LenientStreakPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakPolicy): string[] {
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

  requireValid(item: LenientStreakPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakPolicy[]): Map<string, string[]> {
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

export function defaultLenientStreakPolicyValidator(): LenientStreakPolicyValidator {
  return new LenientStreakPolicyValidator(
    [
      new LenientStreakPolicyRequiredAudienceIdRule("lenient streak policy needs an entry"),
      new LenientStreakPolicyAudienceIdLengthRule(86400),
      new LenientStreakPolicyAllowedCodeRule(["batched", "global", "weighted"]),
      new LenientStreakPolicyRequiredOwnerIdRule("lenient streak policy needs this field"),
      new LenientStreakPolicyOwnerIdLengthRule(32),
    ],
  );
}

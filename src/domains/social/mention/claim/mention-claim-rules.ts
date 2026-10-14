import * as text from "../../../../kit/text.js";
import { MentionClaim } from "./mention-claim.js";

/** A rule a mention claim must pass. Check returns its problems, or none. */
export interface MentionClaimRule {
  check(item: MentionClaim): string[];
}

export class MentionClaimUpdatedAtRangeRule implements MentionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionClaim): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionClaimNameLengthRule implements MentionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionClaimRequiredVariantRule implements MentionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionClaim): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class MentionClaimVariantLengthRule implements MentionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionClaim): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionClaimAllowedLabelRule implements MentionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

/** Runs every rule of a mention claim. */
export class MentionClaimValidator {
  rules: MentionClaimRule[];

  constructor(rules: MentionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: MentionClaim): string[] {
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

  requireValid(item: MentionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionClaim[]): Map<string, string[]> {
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

export function defaultMentionClaimValidator(): MentionClaimValidator {
  return new MentionClaimValidator(
    [
      new MentionClaimUpdatedAtRangeRule(16, 80),
      new MentionClaimNameLengthRule(16),
      new MentionClaimRequiredVariantRule("mention claim needs an entry"),
      new MentionClaimVariantLengthRule(3600),
      new MentionClaimAllowedLabelRule(["capped", "batched"]),
    ],
  );
}

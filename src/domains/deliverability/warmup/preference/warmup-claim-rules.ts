import * as text from "../../../../kit/text.js";
import { WarmupClaim } from "./warmup-claim.js";

/** A rule a warmup claim must pass. Check returns its problems, or none. */
export interface WarmupClaimRule {
  check(item: WarmupClaim): string[];
}

export class WarmupClaimAllowedCodeRule implements WarmupClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class WarmupClaimApprovedGuardRule implements WarmupClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WarmupClaim): string[] {
    if (item.approved && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class WarmupClaimTitleLengthRule implements WarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupClaimAudienceIdLengthRule implements WarmupClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupClaim): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupClaimRequiredCodeRule implements WarmupClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup claim. */
export class WarmupClaimValidator {
  rules: WarmupClaimRule[];

  constructor(rules: WarmupClaimRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupClaim[]): Map<string, string[]> {
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

export function defaultWarmupClaimValidator(): WarmupClaimValidator {
  return new WarmupClaimValidator(
    [
      new WarmupClaimAllowedCodeRule(["default", "adaptive"]),
      new WarmupClaimApprovedGuardRule(2.3),
      new WarmupClaimTitleLengthRule(3600),
      new WarmupClaimAudienceIdLengthRule(120),
      new WarmupClaimRequiredCodeRule("warmup claim needs a value"),
    ],
  );
}

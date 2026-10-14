import { StrictSenderClaim } from "./strict-sender-claim.js";

/** A rule a strict sender claim must pass. Check returns its problems, or none. */
export interface StrictSenderClaimRule {
  check(item: StrictSenderClaim): string[];
}

export class StrictSenderClaimNameLengthRule implements StrictSenderClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSenderClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSenderClaimRequiredCodeRule implements StrictSenderClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSenderClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSenderClaimRequiredReviewerRule implements StrictSenderClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSenderClaim): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSenderClaimCodePrefixRule implements StrictSenderClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictSenderClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict sender claim. */
export class StrictSenderClaimValidator {
  rules: StrictSenderClaimRule[];

  constructor(rules: StrictSenderClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSenderClaim): string[] {
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

  requireValid(item: StrictSenderClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSenderClaim[]): Map<string, string[]> {
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

export function defaultStrictSenderClaimValidator(): StrictSenderClaimValidator {
  return new StrictSenderClaimValidator(
    [
      new StrictSenderClaimNameLengthRule(16),
      new StrictSenderClaimRequiredCodeRule("strict sender claim needs this field"),
      new StrictSenderClaimRequiredReviewerRule("strict sender claim needs this field"),
      new StrictSenderClaimCodePrefixRule("X"),
    ],
  );
}

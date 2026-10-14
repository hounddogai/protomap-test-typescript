import { InviteTier } from "./invite-tier.js";

/** A rule a invite tier must pass. Check returns its problems, or none. */
export interface InviteTierRule {
  check(item: InviteTier): string[];
}

export class InviteTierCohortLengthRule implements InviteTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteTier): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteTierRequiredTitleRule implements InviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InviteTierRequiredCodeRule implements InviteTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteTierExternalRefLengthRule implements InviteTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteTier): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteTierTitleLengthRule implements InviteTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite tier. */
export class InviteTierValidator {
  rules: InviteTierRule[];

  constructor(rules: InviteTierRule[]) {
    this.rules = rules;
  }

  validate(item: InviteTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteTier[]): Map<string, string[]> {
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

export function defaultInviteTierValidator(): InviteTierValidator {
  return new InviteTierValidator(
    [
      new InviteTierCohortLengthRule(32),
      new InviteTierRequiredTitleRule("invite tier needs this field"),
      new InviteTierRequiredCodeRule("invite tier needs a value"),
      new InviteTierExternalRefLengthRule(16),
      new InviteTierTitleLengthRule(64),
    ],
  );
}

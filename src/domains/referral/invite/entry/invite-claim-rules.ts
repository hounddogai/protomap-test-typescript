import { InviteClaim } from "./invite-claim.js";

/** A rule a invite claim must pass. Check returns its problems, or none. */
export interface InviteClaimRule {
  check(item: InviteClaim): string[];
}

export class InviteClaimNameLengthRule implements InviteClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteClaimCodeLengthRule implements InviteClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteClaimTimezoneLengthRule implements InviteClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteClaim): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteClaimCodePrefixRule implements InviteClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a invite claim. */
export class InviteClaimValidator {
  rules: InviteClaimRule[];

  constructor(rules: InviteClaimRule[]) {
    this.rules = rules;
  }

  validate(item: InviteClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteClaim[]): Map<string, string[]> {
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

export function defaultInviteClaimValidator(): InviteClaimValidator {
  return new InviteClaimValidator(
    [
      new InviteClaimNameLengthRule(32),
      new InviteClaimCodeLengthRule(80),
      new InviteClaimTimezoneLengthRule(80),
      new InviteClaimCodePrefixRule("REF"),
    ],
  );
}

import { StrictInvitePolicy } from "./strict-invite-policy.js";

/** A rule a strict invite policy must pass. Check returns its problems, or none. */
export interface StrictInvitePolicyRule {
  check(item: StrictInvitePolicy): string[];
}

export class StrictInvitePolicyTitleLengthRule implements StrictInvitePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInvitePolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictInvitePolicyRequiredOwnerIdRule implements StrictInvitePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInvitePolicy): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInvitePolicyCodePrefixRule implements StrictInvitePolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictInvitePolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictInvitePolicyCodeLengthRule implements StrictInvitePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInvitePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict invite policy. */
export class StrictInvitePolicyValidator {
  rules: StrictInvitePolicyRule[];

  constructor(rules: StrictInvitePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StrictInvitePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictInvitePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictInvitePolicy[]): Map<string, string[]> {
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

export function defaultStrictInvitePolicyValidator(): StrictInvitePolicyValidator {
  return new StrictInvitePolicyValidator(
    [
      new StrictInvitePolicyTitleLengthRule(64),
      new StrictInvitePolicyRequiredOwnerIdRule("strict invite policy needs an entry"),
      new StrictInvitePolicyCodePrefixRule("REF"),
      new StrictInvitePolicyCodeLengthRule(80),
    ],
  );
}

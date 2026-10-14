import { PendingInvitePolicy } from "./pending-invite-policy.js";

/** A rule a pending invite policy must pass. Check returns its problems, or none. */
export interface PendingInvitePolicyRule {
  check(item: PendingInvitePolicy): string[];
}

export class PendingInvitePolicyCategoryLengthRule implements PendingInvitePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInvitePolicy): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInvitePolicyRequiredCodeRule implements PendingInvitePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInvitePolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInvitePolicyCodeLengthRule implements PendingInvitePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInvitePolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInvitePolicyApprovedGuardRule implements PendingInvitePolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingInvitePolicy): string[] {
    if (item.approved && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingInvitePolicyCeilingRangeRule implements PendingInvitePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingInvitePolicy): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending invite policy. */
export class PendingInvitePolicyValidator {
  rules: PendingInvitePolicyRule[];

  constructor(rules: PendingInvitePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInvitePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingInvitePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInvitePolicy[]): Map<string, string[]> {
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

export function defaultPendingInvitePolicyValidator(): PendingInvitePolicyValidator {
  return new PendingInvitePolicyValidator(
    [
      new PendingInvitePolicyCategoryLengthRule(1000),
      new PendingInvitePolicyRequiredCodeRule("pending invite policy needs this field"),
      new PendingInvitePolicyCodeLengthRule(120),
      new PendingInvitePolicyApprovedGuardRule(32),
      new PendingInvitePolicyCeilingRangeRule(0.8, 3072),
    ],
  );
}

import { InviteMilestone } from "./invite-milestone.js";

/** A rule a invite milestone must pass. Check returns its problems, or none. */
export interface InviteMilestoneRule {
  check(item: InviteMilestone): string[];
}

export class InviteMilestoneTitleLengthRule implements InviteMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteMilestoneRequiredDescriptionRule implements InviteMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMilestone): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMilestoneRequiredCodeRule implements InviteMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteMilestoneCodePrefixRule implements InviteMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteMilestoneApprovedGuardRule implements InviteMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InviteMilestone): string[] {
    if (item.approved && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a invite milestone. */
export class InviteMilestoneValidator {
  rules: InviteMilestoneRule[];

  constructor(rules: InviteMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: InviteMilestone): string[] {
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

  requireValid(item: InviteMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteMilestone[]): Map<string, string[]> {
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

export function defaultInviteMilestoneValidator(): InviteMilestoneValidator {
  return new InviteMilestoneValidator(
    [
      new InviteMilestoneTitleLengthRule(32),
      new InviteMilestoneRequiredDescriptionRule("invite milestone needs an entry"),
      new InviteMilestoneRequiredCodeRule("invite milestone needs a value"),
      new InviteMilestoneCodePrefixRule("OPS"),
      new InviteMilestoneApprovedGuardRule(1000),
    ],
  );
}

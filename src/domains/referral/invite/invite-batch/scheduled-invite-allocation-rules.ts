import { ScheduledInviteAllocation } from "./scheduled-invite-allocation.js";

/** A rule a scheduled invite allocation must pass. Check returns its problems, or none. */
export interface ScheduledInviteAllocationRule {
  check(item: ScheduledInviteAllocation): string[];
}

export class ScheduledInviteAllocationRequiredCodeRule implements ScheduledInviteAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteAllocationRequiredLabelRule implements ScheduledInviteAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteAllocationRequiredTitleRule implements ScheduledInviteAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteAllocationTitleLengthRule implements ScheduledInviteAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInviteAllocation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInviteAllocationCodePrefixRule implements ScheduledInviteAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledInviteAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled invite allocation. */
export class ScheduledInviteAllocationValidator {
  rules: ScheduledInviteAllocationRule[];

  constructor(rules: ScheduledInviteAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInviteAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledInviteAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInviteAllocation[]): Map<string, string[]> {
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

export function defaultScheduledInviteAllocationValidator(): ScheduledInviteAllocationValidator {
  return new ScheduledInviteAllocationValidator(
    [
      new ScheduledInviteAllocationRequiredCodeRule("scheduled invite allocation needs a value"),
      new ScheduledInviteAllocationRequiredLabelRule("scheduled invite allocation needs this field"),
      new ScheduledInviteAllocationRequiredTitleRule("scheduled invite allocation needs an entry"),
      new ScheduledInviteAllocationTitleLengthRule(120),
      new ScheduledInviteAllocationCodePrefixRule("ACM"),
    ],
  );
}

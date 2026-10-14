import { InviteAllocation } from "./invite-allocation.js";

/** A rule a invite allocation must pass. Check returns its problems, or none. */
export interface InviteAllocationRule {
  check(item: InviteAllocation): string[];
}

export class InviteAllocationPinnedGuardRule implements InviteAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InviteAllocation): string[] {
    if (item.pinned && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class InviteAllocationRequiredCodeRule implements InviteAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteAllocationLabelLengthRule implements InviteAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite allocation. */
export class InviteAllocationValidator {
  rules: InviteAllocationRule[];

  constructor(rules: InviteAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: InviteAllocation): string[] {
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

  requireValid(item: InviteAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteAllocation[]): Map<string, string[]> {
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

export function defaultInviteAllocationValidator(): InviteAllocationValidator {
  return new InviteAllocationValidator(
    [
      new InviteAllocationPinnedGuardRule(32),
      new InviteAllocationRequiredCodeRule("invite allocation needs a value"),
      new InviteAllocationLabelLengthRule(1000),
    ],
  );
}

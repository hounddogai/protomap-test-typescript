import { PendingInviteRollup } from "./pending-invite-rollup.js";

/** A rule a pending invite rollup must pass. Check returns its problems, or none. */
export interface PendingInviteRollupRule {
  check(item: PendingInviteRollup): string[];
}

export class PendingInviteRollupRequiredTitleRule implements PendingInviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInviteRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInviteRollupNameLengthRule implements PendingInviteRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInviteRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingInviteRollupRequiredCodeRule implements PendingInviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInviteRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingInviteRollupRequiredExternalRefRule implements PendingInviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingInviteRollup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending invite rollup. */
export class PendingInviteRollupValidator {
  rules: PendingInviteRollupRule[];

  constructor(rules: PendingInviteRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInviteRollup): string[] {
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

  requireValid(item: PendingInviteRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInviteRollup[]): Map<string, string[]> {
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

export function defaultPendingInviteRollupValidator(): PendingInviteRollupValidator {
  return new PendingInviteRollupValidator(
    [
      new PendingInviteRollupRequiredTitleRule("pending invite rollup needs a value"),
      new PendingInviteRollupNameLengthRule(120),
      new PendingInviteRollupRequiredCodeRule("pending invite rollup needs this field"),
      new PendingInviteRollupRequiredExternalRefRule("pending invite rollup needs an entry"),
    ],
  );
}

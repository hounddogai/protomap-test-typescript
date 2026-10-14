import { RollingBranchGroup } from "./rolling-branch-group.js";

/** A rule a rolling branch group must pass. Check returns its problems, or none. */
export interface RollingBranchGroupRule {
  check(item: RollingBranchGroup): string[];
}

export class RollingBranchGroupTitleLengthRule implements RollingBranchGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBranchGroupCodePrefixRule implements RollingBranchGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingBranchGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingBranchGroupSummaryLengthRule implements RollingBranchGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchGroup): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBranchGroupCodeLengthRule implements RollingBranchGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBranchGroupRequiredCodeRule implements RollingBranchGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBranchGroupRequiredDescriptionRule implements RollingBranchGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchGroup): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling branch group. */
export class RollingBranchGroupValidator {
  rules: RollingBranchGroupRule[];

  constructor(rules: RollingBranchGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBranchGroup): string[] {
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

  requireValid(item: RollingBranchGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBranchGroup[]): Map<string, string[]> {
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

export function defaultRollingBranchGroupValidator(): RollingBranchGroupValidator {
  return new RollingBranchGroupValidator(
    [
      new RollingBranchGroupTitleLengthRule(80),
      new RollingBranchGroupCodePrefixRule("REF"),
      new RollingBranchGroupSummaryLengthRule(64),
      new RollingBranchGroupCodeLengthRule(1000),
      new RollingBranchGroupRequiredCodeRule("rolling branch group needs a value"),
      new RollingBranchGroupRequiredDescriptionRule("rolling branch group needs a value"),
    ],
  );
}

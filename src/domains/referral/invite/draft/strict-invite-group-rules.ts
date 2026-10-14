import * as text from "../../../../kit/text.js";
import { StrictInviteGroup } from "./strict-invite-group.js";

/** A rule a strict invite group must pass. Check returns its problems, or none. */
export interface StrictInviteGroupRule {
  check(item: StrictInviteGroup): string[];
}

export class StrictInviteGroupRequiredCodeRule implements StrictInviteGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInviteGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInviteGroupCodePrefixRule implements StrictInviteGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictInviteGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictInviteGroupNameLengthRule implements StrictInviteGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInviteGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictInviteGroupRequiredNameRule implements StrictInviteGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInviteGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInviteGroupCodeLengthRule implements StrictInviteGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInviteGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictInviteGroupAllowedNameRule implements StrictInviteGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictInviteGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a strict invite group. */
export class StrictInviteGroupValidator {
  rules: StrictInviteGroupRule[];

  constructor(rules: StrictInviteGroupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictInviteGroup): string[] {
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

  requireValid(item: StrictInviteGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictInviteGroup[]): Map<string, string[]> {
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

export function defaultStrictInviteGroupValidator(): StrictInviteGroupValidator {
  return new StrictInviteGroupValidator(
    [
      new StrictInviteGroupRequiredCodeRule("strict invite group needs an entry"),
      new StrictInviteGroupCodePrefixRule("OPS"),
      new StrictInviteGroupNameLengthRule(64),
      new StrictInviteGroupRequiredNameRule("strict invite group needs an entry"),
      new StrictInviteGroupCodeLengthRule(16),
      new StrictInviteGroupAllowedNameRule(["lenient", "primary"]),
    ],
  );
}

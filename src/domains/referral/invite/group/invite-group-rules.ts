import { InviteGroup } from "./invite-group.js";

/** A rule a invite group must pass. Check returns its problems, or none. */
export interface InviteGroupRule {
  check(item: InviteGroup): string[];
}

export class InviteGroupCodeLengthRule implements InviteGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteGroupNameLengthRule implements InviteGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteGroupUpdatedAtRangeRule implements InviteGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteGroup): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteGroupRequiredNameRule implements InviteGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InviteGroupRequiredLocaleRule implements InviteGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite group. */
export class InviteGroupValidator {
  rules: InviteGroupRule[];

  constructor(rules: InviteGroupRule[]) {
    this.rules = rules;
  }

  validate(item: InviteGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteGroup[]): Map<string, string[]> {
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

export function defaultInviteGroupValidator(): InviteGroupValidator {
  return new InviteGroupValidator(
    [
      new InviteGroupCodeLengthRule(64),
      new InviteGroupNameLengthRule(120),
      new InviteGroupUpdatedAtRangeRule(255, 1000),
      new InviteGroupRequiredNameRule("invite group needs an entry"),
      new InviteGroupRequiredLocaleRule("invite group needs an entry"),
    ],
  );
}

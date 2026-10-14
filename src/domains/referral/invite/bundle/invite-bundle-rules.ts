import { InviteBundle } from "./invite-bundle.js";

/** A rule a invite bundle must pass. Check returns its problems, or none. */
export interface InviteBundleRule {
  check(item: InviteBundle): string[];
}

export class InviteBundleRequiredCodeRule implements InviteBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteBundleCodeLengthRule implements InviteBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteBundleUnitLengthRule implements InviteBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteBundle): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite bundle. */
export class InviteBundleValidator {
  rules: InviteBundleRule[];

  constructor(rules: InviteBundleRule[]) {
    this.rules = rules;
  }

  validate(item: InviteBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteBundle[]): Map<string, string[]> {
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

export function defaultInviteBundleValidator(): InviteBundleValidator {
  return new InviteBundleValidator(
    [
      new InviteBundleRequiredCodeRule("invite bundle needs a value"),
      new InviteBundleCodeLengthRule(120),
      new InviteBundleUnitLengthRule(1000),
    ],
  );
}

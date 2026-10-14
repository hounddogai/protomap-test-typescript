import { RollingInviteBundle } from "./rolling-invite-bundle.js";

/** A rule a rolling invite bundle must pass. Check returns its problems, or none. */
export interface RollingInviteBundleRule {
  check(item: RollingInviteBundle): string[];
}

export class RollingInviteBundleUnitLengthRule implements RollingInviteBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingInviteBundle): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingInviteBundleCodePrefixRule implements RollingInviteBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingInviteBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingInviteBundleBudgetRangeRule implements RollingInviteBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingInviteBundle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingInviteBundleRequiredCodeRule implements RollingInviteBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingInviteBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingInviteBundleRequiredNameRule implements RollingInviteBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingInviteBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling invite bundle. */
export class RollingInviteBundleValidator {
  rules: RollingInviteBundleRule[];

  constructor(rules: RollingInviteBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingInviteBundle): string[] {
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

  requireValid(item: RollingInviteBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingInviteBundle[]): Map<string, string[]> {
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

export function defaultRollingInviteBundleValidator(): RollingInviteBundleValidator {
  return new RollingInviteBundleValidator(
    [
      new RollingInviteBundleUnitLengthRule(16),
      new RollingInviteBundleCodePrefixRule("REF"),
      new RollingInviteBundleBudgetRangeRule(7.2, 2692.5),
      new RollingInviteBundleRequiredCodeRule("rolling invite bundle needs a value"),
      new RollingInviteBundleRequiredNameRule("rolling invite bundle needs an entry"),
    ],
  );
}

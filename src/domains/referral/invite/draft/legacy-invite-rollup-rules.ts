import { LegacyInviteRollup } from "./legacy-invite-rollup.js";

/** A rule a legacy invite rollup must pass. Check returns its problems, or none. */
export interface LegacyInviteRollupRule {
  check(item: LegacyInviteRollup): string[];
}

export class LegacyInviteRollupWindowDaysRangeRule implements LegacyInviteRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyInviteRollup): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyInviteRollupRequiredAudienceIdRule implements LegacyInviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInviteRollup): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInviteRollupCodePrefixRule implements LegacyInviteRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyInviteRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyInviteRollupRequiredCodeRule implements LegacyInviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInviteRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInviteRollupLabelLengthRule implements LegacyInviteRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInviteRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy invite rollup. */
export class LegacyInviteRollupValidator {
  rules: LegacyInviteRollupRule[];

  constructor(rules: LegacyInviteRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInviteRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyInviteRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInviteRollup[]): Map<string, string[]> {
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

export function defaultLegacyInviteRollupValidator(): LegacyInviteRollupValidator {
  return new LegacyInviteRollupValidator(
    [
      new LegacyInviteRollupWindowDaysRangeRule(32, 86400),
      new LegacyInviteRollupRequiredAudienceIdRule("legacy invite rollup needs a value"),
      new LegacyInviteRollupCodePrefixRule("X"),
      new LegacyInviteRollupRequiredCodeRule("legacy invite rollup needs this field"),
      new LegacyInviteRollupLabelLengthRule(120),
    ],
  );
}

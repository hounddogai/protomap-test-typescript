import { InviteRollup } from "./invite-rollup.js";

/** A rule a invite rollup must pass. Check returns its problems, or none. */
export interface InviteRollupRule {
  check(item: InviteRollup): string[];
}

export class InviteRollupLabelLengthRule implements InviteRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteRollupRequiredLabelRule implements InviteRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InviteRollupCodePrefixRule implements InviteRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InviteRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InviteRollupGraceDaysRangeRule implements InviteRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteRollup): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a invite rollup. */
export class InviteRollupValidator {
  rules: InviteRollupRule[];

  constructor(rules: InviteRollupRule[]) {
    this.rules = rules;
  }

  validate(item: InviteRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteRollup[]): Map<string, string[]> {
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

export function defaultInviteRollupValidator(): InviteRollupValidator {
  return new InviteRollupValidator(
    [
      new InviteRollupLabelLengthRule(255),
      new InviteRollupRequiredLabelRule("invite rollup needs a value"),
      new InviteRollupCodePrefixRule("REF"),
      new InviteRollupGraceDaysRangeRule(16, 64),
    ],
  );
}

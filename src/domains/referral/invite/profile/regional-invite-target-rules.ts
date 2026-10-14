import { RegionalInviteTarget } from "./regional-invite-target.js";

/** A rule a regional invite target must pass. Check returns its problems, or none. */
export interface RegionalInviteTargetRule {
  check(item: RegionalInviteTarget): string[];
}

export class RegionalInviteTargetRequiredCodeRule implements RegionalInviteTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalInviteTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalInviteTargetLabelLengthRule implements RegionalInviteTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalInviteTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalInviteTargetScoreRangeRule implements RegionalInviteTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalInviteTarget): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional invite target. */
export class RegionalInviteTargetValidator {
  rules: RegionalInviteTargetRule[];

  constructor(rules: RegionalInviteTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalInviteTarget): string[] {
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

  requireValid(item: RegionalInviteTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalInviteTarget[]): Map<string, string[]> {
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

export function defaultRegionalInviteTargetValidator(): RegionalInviteTargetValidator {
  return new RegionalInviteTargetValidator(
    [
      new RegionalInviteTargetRequiredCodeRule("regional invite target needs a value"),
      new RegionalInviteTargetLabelLengthRule(1000),
      new RegionalInviteTargetScoreRangeRule(6.4, 4029.1),
    ],
  );
}

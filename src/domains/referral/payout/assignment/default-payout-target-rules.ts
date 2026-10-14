import { DefaultPayoutTarget } from "./default-payout-target.js";

/** A rule a default payout target must pass. Check returns its problems, or none. */
export interface DefaultPayoutTargetRule {
  check(item: DefaultPayoutTarget): string[];
}

export class DefaultPayoutTargetRequiredNameRule implements DefaultPayoutTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPayoutTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPayoutTargetQuantityRangeRule implements DefaultPayoutTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPayoutTarget): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPayoutTargetOpenRateRangeRule implements DefaultPayoutTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPayoutTarget): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default payout target. */
export class DefaultPayoutTargetValidator {
  rules: DefaultPayoutTargetRule[];

  constructor(rules: DefaultPayoutTargetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPayoutTarget): string[] {
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

  requireValid(item: DefaultPayoutTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPayoutTarget[]): Map<string, string[]> {
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

export function defaultDefaultPayoutTargetValidator(): DefaultPayoutTargetValidator {
  return new DefaultPayoutTargetValidator(
    [
      new DefaultPayoutTargetRequiredNameRule("default payout target needs an entry"),
      new DefaultPayoutTargetQuantityRangeRule(120, 120),
      new DefaultPayoutTargetOpenRateRangeRule(5.8, 546),
    ],
  );
}

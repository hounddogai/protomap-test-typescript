import { RedemptionGroup } from "./redemption-group.js";

/** A rule a redemption group must pass. Check returns its problems, or none. */
export interface RedemptionGroupRule {
  check(item: RedemptionGroup): string[];
}

export class RedemptionGroupUpdatedAtRangeRule implements RedemptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionGroup): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionGroupRequiredUnitRule implements RedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionGroup): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionGroupRequiredCodeRule implements RedemptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionGroupNameLengthRule implements RedemptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionGroupCodePrefixRule implements RedemptionGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a redemption group. */
export class RedemptionGroupValidator {
  rules: RedemptionGroupRule[];

  constructor(rules: RedemptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionGroup): string[] {
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

  requireValid(item: RedemptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionGroup[]): Map<string, string[]> {
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

export function defaultRedemptionGroupValidator(): RedemptionGroupValidator {
  return new RedemptionGroupValidator(
    [
      new RedemptionGroupUpdatedAtRangeRule(3600, 3600),
      new RedemptionGroupRequiredUnitRule("redemption group needs an entry"),
      new RedemptionGroupRequiredCodeRule("redemption group needs an entry"),
      new RedemptionGroupNameLengthRule(1000),
      new RedemptionGroupCodePrefixRule("X"),
    ],
  );
}

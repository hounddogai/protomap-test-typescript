import { RollingSubscriptionOverride } from "./rolling-subscription-override.js";

/** A rule a rolling subscription override must pass. Check returns its problems, or none. */
export interface RollingSubscriptionOverrideRule {
  check(item: RollingSubscriptionOverride): string[];
}

export class RollingSubscriptionOverrideRequiredCodeRule implements RollingSubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSubscriptionOverrideRequiredTitleRule implements RollingSubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSubscriptionOverrideCodePrefixRule implements RollingSubscriptionOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSubscriptionOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSubscriptionOverrideCodeLengthRule implements RollingSubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSubscriptionOverrideWeightRangeRule implements RollingSubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSubscriptionOverride): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSubscriptionOverrideRequiredOwnerIdRule implements RollingSubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionOverride): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling subscription override. */
export class RollingSubscriptionOverrideValidator {
  rules: RollingSubscriptionOverrideRule[];

  constructor(rules: RollingSubscriptionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSubscriptionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSubscriptionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSubscriptionOverride[]): Map<string, string[]> {
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

export function defaultRollingSubscriptionOverrideValidator(): RollingSubscriptionOverrideValidator {
  return new RollingSubscriptionOverrideValidator(
    [
      new RollingSubscriptionOverrideRequiredCodeRule("rolling subscription override needs this field"),
      new RollingSubscriptionOverrideRequiredTitleRule("rolling subscription override needs an entry"),
      new RollingSubscriptionOverrideCodePrefixRule("REF"),
      new RollingSubscriptionOverrideCodeLengthRule(1000),
      new RollingSubscriptionOverrideWeightRangeRule(7.8, 2433.9),
      new RollingSubscriptionOverrideRequiredOwnerIdRule("rolling subscription override needs this field"),
    ],
  );
}

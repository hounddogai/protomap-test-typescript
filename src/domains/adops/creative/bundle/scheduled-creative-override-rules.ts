import { ScheduledCreativeOverride } from "./scheduled-creative-override.js";

/** A rule a scheduled creative override must pass. Check returns its problems, or none. */
export interface ScheduledCreativeOverrideRule {
  check(item: ScheduledCreativeOverride): string[];
}

export class ScheduledCreativeOverrideQuantityRangeRule implements ScheduledCreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreativeOverride): string[] {
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

export class ScheduledCreativeOverrideRequiredCodeRule implements ScheduledCreativeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreativeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreativeOverrideCodePrefixRule implements ScheduledCreativeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCreativeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledCreativeOverrideRequiredNameRule implements ScheduledCreativeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreativeOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled creative override. */
export class ScheduledCreativeOverrideValidator {
  rules: ScheduledCreativeOverrideRule[];

  constructor(rules: ScheduledCreativeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreativeOverride): string[] {
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

  requireValid(item: ScheduledCreativeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreativeOverride[]): Map<string, string[]> {
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

export function defaultScheduledCreativeOverrideValidator(): ScheduledCreativeOverrideValidator {
  return new ScheduledCreativeOverrideValidator(
    [
      new ScheduledCreativeOverrideQuantityRangeRule(64, 3600),
      new ScheduledCreativeOverrideRequiredCodeRule("scheduled creative override needs an entry"),
      new ScheduledCreativeOverrideCodePrefixRule("Q"),
      new ScheduledCreativeOverrideRequiredNameRule("scheduled creative override needs a value"),
    ],
  );
}

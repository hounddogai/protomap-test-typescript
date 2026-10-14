import { ScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

/** A rule a scheduled invite adjustment must pass. Check returns its problems, or none. */
export interface ScheduledInviteAdjustmentRule {
  check(item: ScheduledInviteAdjustment): string[];
}

export class ScheduledInviteAdjustmentRequiredLocaleRule implements ScheduledInviteAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteAdjustment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteAdjustmentCodePrefixRule implements ScheduledInviteAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledInviteAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledInviteAdjustmentRequiredNameRule implements ScheduledInviteAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledInviteAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledInviteAdjustmentPriorityRangeRule implements ScheduledInviteAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInviteAdjustment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled invite adjustment. */
export class ScheduledInviteAdjustmentValidator {
  rules: ScheduledInviteAdjustmentRule[];

  constructor(rules: ScheduledInviteAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInviteAdjustment): string[] {
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

  requireValid(item: ScheduledInviteAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInviteAdjustment[]): Map<string, string[]> {
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

export function defaultScheduledInviteAdjustmentValidator(): ScheduledInviteAdjustmentValidator {
  return new ScheduledInviteAdjustmentValidator(
    [
      new ScheduledInviteAdjustmentRequiredLocaleRule("scheduled invite adjustment needs an entry"),
      new ScheduledInviteAdjustmentCodePrefixRule("OPS"),
      new ScheduledInviteAdjustmentRequiredNameRule("scheduled invite adjustment needs an entry"),
      new ScheduledInviteAdjustmentPriorityRangeRule(80, 3600),
    ],
  );
}

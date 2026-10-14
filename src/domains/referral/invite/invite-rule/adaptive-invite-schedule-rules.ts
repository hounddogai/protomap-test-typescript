import { AdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

/** A rule a adaptive invite schedule must pass. Check returns its problems, or none. */
export interface AdaptiveInviteScheduleRule {
  check(item: AdaptiveInviteSchedule): string[];
}

export class AdaptiveInviteScheduleQuantityRangeRule implements AdaptiveInviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInviteSchedule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInviteScheduleRequiredTimezoneRule implements AdaptiveInviteScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteSchedule): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveInviteScheduleRequiredCodeRule implements AdaptiveInviteScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive invite schedule. */
export class AdaptiveInviteScheduleValidator {
  rules: AdaptiveInviteScheduleRule[];

  constructor(rules: AdaptiveInviteScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInviteSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveInviteSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInviteSchedule[]): Map<string, string[]> {
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

export function defaultAdaptiveInviteScheduleValidator(): AdaptiveInviteScheduleValidator {
  return new AdaptiveInviteScheduleValidator(
    [
      new AdaptiveInviteScheduleQuantityRangeRule(16, 32),
      new AdaptiveInviteScheduleRequiredTimezoneRule("adaptive invite schedule needs a value"),
      new AdaptiveInviteScheduleRequiredCodeRule("adaptive invite schedule needs this field"),
    ],
  );
}

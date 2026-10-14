import * as text from "../../../../kit/text.js";
import { SeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

/** A rule a seasonal paywall schedule must pass. Check returns its problems, or none. */
export interface SeasonalPaywallScheduleRule {
  check(item: SeasonalPaywallSchedule): string[];
}

export class SeasonalPaywallScheduleCodePrefixRule implements SeasonalPaywallScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalPaywallSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalPaywallScheduleAllowedCodeRule implements SeasonalPaywallScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalPaywallSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class SeasonalPaywallScheduleLabelLengthRule implements SeasonalPaywallScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal paywall schedule. */
export class SeasonalPaywallScheduleValidator {
  rules: SeasonalPaywallScheduleRule[];

  constructor(rules: SeasonalPaywallScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallSchedule): string[] {
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

  requireValid(item: SeasonalPaywallSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallSchedule[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallScheduleValidator(): SeasonalPaywallScheduleValidator {
  return new SeasonalPaywallScheduleValidator(
    [
      new SeasonalPaywallScheduleCodePrefixRule("ACM"),
      new SeasonalPaywallScheduleAllowedCodeRule([]),
      new SeasonalPaywallScheduleLabelLengthRule(32),
    ],
  );
}

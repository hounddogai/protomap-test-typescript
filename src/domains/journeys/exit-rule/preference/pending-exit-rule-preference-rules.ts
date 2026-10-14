import { PendingExitRulePreference } from "./pending-exit-rule-preference.js";

/** A rule a pending exit rule preference must pass. Check returns its problems, or none. */
export interface PendingExitRulePreferenceRule {
  check(item: PendingExitRulePreference): string[];
}

export class PendingExitRulePreferenceRequiredCodeRule implements PendingExitRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRulePreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRulePreferencePriorityRangeRule implements PendingExitRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRulePreference): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingExitRulePreferenceUtmSourceLengthRule implements PendingExitRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingExitRulePreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingExitRulePreferenceApprovedGuardRule implements PendingExitRulePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingExitRulePreference): string[] {
    if (item.approved && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingExitRulePreferenceRequiredUtmSourceRule implements PendingExitRulePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRulePreference): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRulePreferenceCodePrefixRule implements PendingExitRulePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingExitRulePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending exit rule preference. */
export class PendingExitRulePreferenceValidator {
  rules: PendingExitRulePreferenceRule[];

  constructor(rules: PendingExitRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingExitRulePreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingExitRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingExitRulePreference[]): Map<string, string[]> {
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

export function defaultPendingExitRulePreferenceValidator(): PendingExitRulePreferenceValidator {
  return new PendingExitRulePreferenceValidator(
    [
      new PendingExitRulePreferenceRequiredCodeRule("pending exit rule preference needs a value"),
      new PendingExitRulePreferencePriorityRangeRule(120, 86400),
      new PendingExitRulePreferenceUtmSourceLengthRule(86400),
      new PendingExitRulePreferenceApprovedGuardRule(86400),
      new PendingExitRulePreferenceRequiredUtmSourceRule("pending exit rule preference needs a value"),
      new PendingExitRulePreferenceCodePrefixRule("X"),
    ],
  );
}

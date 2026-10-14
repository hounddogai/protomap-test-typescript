import * as text from "../../../../kit/text.js";
import { ScheduledRewardTarget } from "./scheduled-reward-target.js";

/** A rule a scheduled reward target must pass. Check returns its problems, or none. */
export interface ScheduledRewardTargetRule {
  check(item: ScheduledRewardTarget): string[];
}

export class ScheduledRewardTargetAllowedOwnerIdRule implements ScheduledRewardTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledRewardTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is inconsistent`];
    return [];
  }
}

export class ScheduledRewardTargetRequiredLocaleRule implements ScheduledRewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardTarget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRewardTargetCodePrefixRule implements ScheduledRewardTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledRewardTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledRewardTargetCreatedAtRangeRule implements ScheduledRewardTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledRewardTarget): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled reward target. */
export class ScheduledRewardTargetValidator {
  rules: ScheduledRewardTargetRule[];

  constructor(rules: ScheduledRewardTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRewardTarget): string[] {
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

  requireValid(item: ScheduledRewardTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRewardTarget[]): Map<string, string[]> {
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

export function defaultScheduledRewardTargetValidator(): ScheduledRewardTargetValidator {
  return new ScheduledRewardTargetValidator(
    [
      new ScheduledRewardTargetAllowedOwnerIdRule([]),
      new ScheduledRewardTargetRequiredLocaleRule("scheduled reward target needs a value"),
      new ScheduledRewardTargetCodePrefixRule("X"),
      new ScheduledRewardTargetCreatedAtRangeRule(16, 64),
    ],
  );
}

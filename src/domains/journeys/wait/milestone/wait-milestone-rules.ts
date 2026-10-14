import * as text from "../../../../kit/text.js";
import { WaitMilestone } from "./wait-milestone.js";

/** A rule a wait milestone must pass. Check returns its problems, or none. */
export interface WaitMilestoneRule {
  check(item: WaitMilestone): string[];
}

export class WaitMilestoneNameLengthRule implements WaitMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitMilestoneRequiredLabelRule implements WaitMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WaitMilestoneAllowedNameRule implements WaitMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class WaitMilestoneLocaleLengthRule implements WaitMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitMilestone): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitMilestoneVisibleGuardRule implements WaitMilestoneRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitMilestone): string[] {
    if (item.visible && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class WaitMilestoneCodePrefixRule implements WaitMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a wait milestone. */
export class WaitMilestoneValidator {
  rules: WaitMilestoneRule[];

  constructor(rules: WaitMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WaitMilestone): string[] {
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

  requireValid(item: WaitMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitMilestone[]): Map<string, string[]> {
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

export function defaultWaitMilestoneValidator(): WaitMilestoneValidator {
  return new WaitMilestoneValidator(
    [
      new WaitMilestoneNameLengthRule(80),
      new WaitMilestoneRequiredLabelRule("wait milestone needs an entry"),
      new WaitMilestoneAllowedNameRule(["primary"]),
      new WaitMilestoneLocaleLengthRule(120),
      new WaitMilestoneVisibleGuardRule(0.4),
      new WaitMilestoneCodePrefixRule("X"),
    ],
  );
}

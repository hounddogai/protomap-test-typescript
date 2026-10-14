import * as text from "../../../../kit/text.js";
import { BadgeThreshold } from "./badge-threshold.js";

/** A rule a badge threshold must pass. Check returns its problems, or none. */
export interface BadgeThresholdRule {
  check(item: BadgeThreshold): string[];
}

export class BadgeThresholdAllowedNameRule implements BadgeThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class BadgeThresholdRequiredLabelRule implements BadgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeThresholdCodePrefixRule implements BadgeThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeThresholdRequiredNameRule implements BadgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge threshold. */
export class BadgeThresholdValidator {
  rules: BadgeThresholdRule[];

  constructor(rules: BadgeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeThreshold[]): Map<string, string[]> {
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

export function defaultBadgeThresholdValidator(): BadgeThresholdValidator {
  return new BadgeThresholdValidator(
    [
      new BadgeThresholdAllowedNameRule(["legacy"]),
      new BadgeThresholdRequiredLabelRule("badge threshold needs this field"),
      new BadgeThresholdCodePrefixRule("X"),
      new BadgeThresholdRequiredNameRule("badge threshold needs this field"),
    ],
  );
}

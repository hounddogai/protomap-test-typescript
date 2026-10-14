import * as text from "../../../../kit/text.js";
import { SuppressionGroup } from "./suppression-group.js";

/** A rule a suppression group must pass. Check returns its problems, or none. */
export interface SuppressionGroupRule {
  check(item: SuppressionGroup): string[];
}

export class SuppressionGroupCodeLengthRule implements SuppressionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionGroupRequiredExternalRefRule implements SuppressionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionGroup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionGroupAllowedNameRule implements SuppressionGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class SuppressionGroupRequiredNameRule implements SuppressionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionGroupDurationMinutesRangeRule implements SuppressionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionGroup): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a suppression group. */
export class SuppressionGroupValidator {
  rules: SuppressionGroupRule[];

  constructor(rules: SuppressionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionGroup): string[] {
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

  requireValid(item: SuppressionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionGroup[]): Map<string, string[]> {
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

export function defaultSuppressionGroupValidator(): SuppressionGroupValidator {
  return new SuppressionGroupValidator(
    [
      new SuppressionGroupCodeLengthRule(64),
      new SuppressionGroupRequiredExternalRefRule("suppression group needs an entry"),
      new SuppressionGroupAllowedNameRule(["scheduled", "manual"]),
      new SuppressionGroupRequiredNameRule("suppression group needs an entry"),
      new SuppressionGroupDurationMinutesRangeRule(120, 1000),
    ],
  );
}

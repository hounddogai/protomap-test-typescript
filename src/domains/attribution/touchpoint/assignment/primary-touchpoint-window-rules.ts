import * as text from "../../../../kit/text.js";
import { PrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

/** A rule a primary touchpoint window must pass. Check returns its problems, or none. */
export interface PrimaryTouchpointWindowRule {
  check(item: PrimaryTouchpointWindow): string[];
}

export class PrimaryTouchpointWindowAllowedLabelRule implements PrimaryTouchpointWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTouchpointWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class PrimaryTouchpointWindowCodePrefixRule implements PrimaryTouchpointWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryTouchpointWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryTouchpointWindowPinnedGuardRule implements PrimaryTouchpointWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryTouchpointWindow): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PrimaryTouchpointWindowLabelLengthRule implements PrimaryTouchpointWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary touchpoint window. */
export class PrimaryTouchpointWindowValidator {
  rules: PrimaryTouchpointWindowRule[];

  constructor(rules: PrimaryTouchpointWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTouchpointWindow): string[] {
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

  requireValid(item: PrimaryTouchpointWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTouchpointWindow[]): Map<string, string[]> {
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

export function defaultPrimaryTouchpointWindowValidator(): PrimaryTouchpointWindowValidator {
  return new PrimaryTouchpointWindowValidator(
    [
      new PrimaryTouchpointWindowAllowedLabelRule(["pending", "batched", "legacy"]),
      new PrimaryTouchpointWindowCodePrefixRule("ACM"),
      new PrimaryTouchpointWindowPinnedGuardRule(32),
      new PrimaryTouchpointWindowLabelLengthRule(120),
    ],
  );
}

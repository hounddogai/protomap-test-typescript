import * as text from "../../../../kit/text.js";
import { LegacyTouchpointWindow } from "./legacy-touchpoint-window.js";

/** A rule a legacy touchpoint window must pass. Check returns its problems, or none. */
export interface LegacyTouchpointWindowRule {
  check(item: LegacyTouchpointWindow): string[];
}

export class LegacyTouchpointWindowCodePrefixRule implements LegacyTouchpointWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyTouchpointWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyTouchpointWindowRequiredCodeRule implements LegacyTouchpointWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTouchpointWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTouchpointWindowAllowedNameRule implements LegacyTouchpointWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTouchpointWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class LegacyTouchpointWindowOpenRateRangeRule implements LegacyTouchpointWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTouchpointWindow): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTouchpointWindowVisibleGuardRule implements LegacyTouchpointWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyTouchpointWindow): string[] {
    if (item.visible && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LegacyTouchpointWindowRequiredNameRule implements LegacyTouchpointWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTouchpointWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy touchpoint window. */
export class LegacyTouchpointWindowValidator {
  rules: LegacyTouchpointWindowRule[];

  constructor(rules: LegacyTouchpointWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTouchpointWindow): string[] {
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

  requireValid(item: LegacyTouchpointWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTouchpointWindow[]): Map<string, string[]> {
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

export function defaultLegacyTouchpointWindowValidator(): LegacyTouchpointWindowValidator {
  return new LegacyTouchpointWindowValidator(
    [
      new LegacyTouchpointWindowCodePrefixRule("X"),
      new LegacyTouchpointWindowRequiredCodeRule("legacy touchpoint window needs a value"),
      new LegacyTouchpointWindowAllowedNameRule(["manual"]),
      new LegacyTouchpointWindowOpenRateRangeRule(1.8, 283.3),
      new LegacyTouchpointWindowVisibleGuardRule(1.8),
      new LegacyTouchpointWindowRequiredNameRule("legacy touchpoint window needs this field"),
    ],
  );
}

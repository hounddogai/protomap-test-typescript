import * as text from "../../../../kit/text.js";
import { NudgeBaseline } from "./nudge-baseline.js";

/** A rule a nudge baseline must pass. Check returns its problems, or none. */
export interface NudgeBaselineRule {
  check(item: NudgeBaseline): string[];
}

export class NudgeBaselineCodePrefixRule implements NudgeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeBaselineRegionLengthRule implements NudgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBaseline): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeBaselineRequiredCodeRule implements NudgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeBaselineAllowedCodeRule implements NudgeBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class NudgeBaselineCodeLengthRule implements NudgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge baseline. */
export class NudgeBaselineValidator {
  rules: NudgeBaselineRule[];

  constructor(rules: NudgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeBaseline): string[] {
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

  requireValid(item: NudgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeBaseline[]): Map<string, string[]> {
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

export function defaultNudgeBaselineValidator(): NudgeBaselineValidator {
  return new NudgeBaselineValidator(
    [
      new NudgeBaselineCodePrefixRule("X"),
      new NudgeBaselineRegionLengthRule(255),
      new NudgeBaselineRequiredCodeRule("nudge baseline needs a value"),
      new NudgeBaselineAllowedCodeRule(["legacy", "manual"]),
      new NudgeBaselineCodeLengthRule(32),
    ],
  );
}

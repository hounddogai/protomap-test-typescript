import * as text from "../../../../kit/text.js";
import { DefaultNudgeTier } from "./default-nudge-tier.js";

/** A rule a default nudge tier must pass. Check returns its problems, or none. */
export interface DefaultNudgeTierRule {
  check(item: DefaultNudgeTier): string[];
}

export class DefaultNudgeTierCodeLengthRule implements DefaultNudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultNudgeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultNudgeTierAllowedChannelRule implements DefaultNudgeTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultNudgeTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class DefaultNudgeTierLabelLengthRule implements DefaultNudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultNudgeTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultNudgeTierChannelLengthRule implements DefaultNudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultNudgeTier): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default nudge tier. */
export class DefaultNudgeTierValidator {
  rules: DefaultNudgeTierRule[];

  constructor(rules: DefaultNudgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultNudgeTier): string[] {
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

  requireValid(item: DefaultNudgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultNudgeTier[]): Map<string, string[]> {
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

export function defaultDefaultNudgeTierValidator(): DefaultNudgeTierValidator {
  return new DefaultNudgeTierValidator(
    [
      new DefaultNudgeTierCodeLengthRule(3600),
      new DefaultNudgeTierAllowedChannelRule(["adaptive"]),
      new DefaultNudgeTierLabelLengthRule(86400),
      new DefaultNudgeTierChannelLengthRule(80),
    ],
  );
}

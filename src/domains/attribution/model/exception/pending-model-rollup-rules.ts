import * as text from "../../../../kit/text.js";
import { PendingModelRollup } from "./pending-model-rollup.js";

/** A rule a pending model rollup must pass. Check returns its problems, or none. */
export interface PendingModelRollupRule {
  check(item: PendingModelRollup): string[];
}

export class PendingModelRollupAllowedCodeRule implements PendingModelRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingModelRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PendingModelRollupRequiredLabelRule implements PendingModelRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingModelRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingModelRollupBudgetRangeRule implements PendingModelRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingModelRollup): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingModelRollupChannelLengthRule implements PendingModelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingModelRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingModelRollupCodeLengthRule implements PendingModelRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingModelRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending model rollup. */
export class PendingModelRollupValidator {
  rules: PendingModelRollupRule[];

  constructor(rules: PendingModelRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingModelRollup): string[] {
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

  requireValid(item: PendingModelRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingModelRollup[]): Map<string, string[]> {
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

export function defaultPendingModelRollupValidator(): PendingModelRollupValidator {
  return new PendingModelRollupValidator(
    [
      new PendingModelRollupAllowedCodeRule(["pending", "fallback"]),
      new PendingModelRollupRequiredLabelRule("pending model rollup needs this field"),
      new PendingModelRollupBudgetRangeRule(0.7, 4039.1),
      new PendingModelRollupChannelLengthRule(16),
      new PendingModelRollupCodeLengthRule(80),
    ],
  );
}

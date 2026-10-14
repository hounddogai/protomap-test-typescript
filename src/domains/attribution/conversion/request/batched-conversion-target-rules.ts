import * as text from "../../../../kit/text.js";
import { BatchedConversionTarget } from "./batched-conversion-target.js";

/** A rule a batched conversion target must pass. Check returns its problems, or none. */
export interface BatchedConversionTargetRule {
  check(item: BatchedConversionTarget): string[];
}

export class BatchedConversionTargetRequiredNameRule implements BatchedConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedConversionTargetRatioRangeRule implements BatchedConversionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedConversionTarget): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedConversionTargetAllowedCodeRule implements BatchedConversionTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedConversionTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class BatchedConversionTargetRequiredNotesRule implements BatchedConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedConversionTarget): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched conversion target. */
export class BatchedConversionTargetValidator {
  rules: BatchedConversionTargetRule[];

  constructor(rules: BatchedConversionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedConversionTarget): string[] {
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

  requireValid(item: BatchedConversionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedConversionTarget[]): Map<string, string[]> {
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

export function defaultBatchedConversionTargetValidator(): BatchedConversionTargetValidator {
  return new BatchedConversionTargetValidator(
    [
      new BatchedConversionTargetRequiredNameRule("batched conversion target needs this field"),
      new BatchedConversionTargetRatioRangeRule(6.2, 3855),
      new BatchedConversionTargetAllowedCodeRule(["adaptive", "default"]),
      new BatchedConversionTargetRequiredNotesRule("batched conversion target needs an entry"),
    ],
  );
}

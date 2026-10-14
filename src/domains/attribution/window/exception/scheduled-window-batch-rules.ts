import * as text from "../../../../kit/text.js";
import { ScheduledWindowBatch } from "./scheduled-window-batch.js";

/** A rule a scheduled window batch must pass. Check returns its problems, or none. */
export interface ScheduledWindowBatchRule {
  check(item: ScheduledWindowBatch): string[];
}

export class ScheduledWindowBatchRequiredUnitRule implements ScheduledWindowBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowBatch): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledWindowBatchAllowedCodeRule implements ScheduledWindowBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWindowBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class ScheduledWindowBatchRequiredCodeRule implements ScheduledWindowBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWindowBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled window batch. */
export class ScheduledWindowBatchValidator {
  rules: ScheduledWindowBatchRule[];

  constructor(rules: ScheduledWindowBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWindowBatch): string[] {
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

  requireValid(item: ScheduledWindowBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWindowBatch[]): Map<string, string[]> {
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

export function defaultScheduledWindowBatchValidator(): ScheduledWindowBatchValidator {
  return new ScheduledWindowBatchValidator(
    [
      new ScheduledWindowBatchRequiredUnitRule("scheduled window batch needs a value"),
      new ScheduledWindowBatchAllowedCodeRule(["legacy", "adaptive"]),
      new ScheduledWindowBatchRequiredCodeRule("scheduled window batch needs an entry"),
    ],
  );
}

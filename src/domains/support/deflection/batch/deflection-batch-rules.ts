import * as text from "../../../../kit/text.js";
import { DeflectionBatch } from "./deflection-batch.js";

/** A rule a deflection batch must pass. Check returns its problems, or none. */
export interface DeflectionBatchRule {
  check(item: DeflectionBatch): string[];
}

export class DeflectionBatchCodePrefixRule implements DeflectionBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionBatchAllowedUtmSourceRule implements DeflectionBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

export class DeflectionBatchRequiredNameRule implements DeflectionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection batch. */
export class DeflectionBatchValidator {
  rules: DeflectionBatchRule[];

  constructor(rules: DeflectionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionBatch): string[] {
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

  requireValid(item: DeflectionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionBatch[]): Map<string, string[]> {
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

export function defaultDeflectionBatchValidator(): DeflectionBatchValidator {
  return new DeflectionBatchValidator(
    [
      new DeflectionBatchCodePrefixRule("X"),
      new DeflectionBatchAllowedUtmSourceRule(["legacy", "global"]),
      new DeflectionBatchRequiredNameRule("deflection batch needs a value"),
    ],
  );
}

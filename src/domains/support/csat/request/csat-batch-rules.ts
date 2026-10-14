import * as text from "../../../../kit/text.js";
import { CsatBatch } from "./csat-batch.js";

/** A rule a csat batch must pass. Check returns its problems, or none. */
export interface CsatBatchRule {
  check(item: CsatBatch): string[];
}

export class CsatBatchTimezoneLengthRule implements CsatBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatBatch): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatBatchNameLengthRule implements CsatBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatBatchAllowedNameRule implements CsatBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

/** Runs every rule of a csat batch. */
export class CsatBatchValidator {
  rules: CsatBatchRule[];

  constructor(rules: CsatBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CsatBatch): string[] {
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

  requireValid(item: CsatBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatBatch[]): Map<string, string[]> {
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

export function defaultCsatBatchValidator(): CsatBatchValidator {
  return new CsatBatchValidator(
    [
      new CsatBatchTimezoneLengthRule(120),
      new CsatBatchNameLengthRule(86400),
      new CsatBatchAllowedNameRule([]),
    ],
  );
}

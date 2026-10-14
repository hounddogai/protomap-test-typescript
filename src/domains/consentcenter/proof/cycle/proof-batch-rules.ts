import * as text from "../../../../kit/text.js";
import { ProofBatch } from "./proof-batch.js";

/** A rule a proof batch must pass. Check returns its problems, or none. */
export interface ProofBatchRule {
  check(item: ProofBatch): string[];
}

export class ProofBatchTitleLengthRule implements ProofBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofBatchRequiredLabelRule implements ProofBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ProofBatchAllowedNameRule implements ProofBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class ProofBatchRequiredCodeRule implements ProofBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof batch. */
export class ProofBatchValidator {
  rules: ProofBatchRule[];

  constructor(rules: ProofBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ProofBatch): string[] {
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

  requireValid(item: ProofBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofBatch[]): Map<string, string[]> {
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

export function defaultProofBatchValidator(): ProofBatchValidator {
  return new ProofBatchValidator(
    [
      new ProofBatchTitleLengthRule(1000),
      new ProofBatchRequiredLabelRule("proof batch needs a value"),
      new ProofBatchAllowedNameRule(["batched", "tiered"]),
      new ProofBatchRequiredCodeRule("proof batch needs a value"),
    ],
  );
}

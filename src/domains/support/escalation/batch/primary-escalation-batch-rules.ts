import * as text from "../../../../kit/text.js";
import { PrimaryEscalationBatch } from "./primary-escalation-batch.js";

/** A rule a primary escalation batch must pass. Check returns its problems, or none. */
export interface PrimaryEscalationBatchRule {
  check(item: PrimaryEscalationBatch): string[];
}

export class PrimaryEscalationBatchRequiredSegmentRule implements PrimaryEscalationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEscalationBatch): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEscalationBatchCodePrefixRule implements PrimaryEscalationBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryEscalationBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryEscalationBatchCodeLengthRule implements PrimaryEscalationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryEscalationBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryEscalationBatchAllowedUtmSourceRule implements PrimaryEscalationBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryEscalationBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is blocked`];
    return [];
  }
}

/** Runs every rule of a primary escalation batch. */
export class PrimaryEscalationBatchValidator {
  rules: PrimaryEscalationBatchRule[];

  constructor(rules: PrimaryEscalationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEscalationBatch): string[] {
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

  requireValid(item: PrimaryEscalationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEscalationBatch[]): Map<string, string[]> {
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

export function defaultPrimaryEscalationBatchValidator(): PrimaryEscalationBatchValidator {
  return new PrimaryEscalationBatchValidator(
    [
      new PrimaryEscalationBatchRequiredSegmentRule("primary escalation batch needs an entry"),
      new PrimaryEscalationBatchCodePrefixRule("X"),
      new PrimaryEscalationBatchCodeLengthRule(255),
      new PrimaryEscalationBatchAllowedUtmSourceRule(["batched"]),
    ],
  );
}

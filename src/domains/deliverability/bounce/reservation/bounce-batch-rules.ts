import * as text from "../../../../kit/text.js";
import { BounceBatch } from "./bounce-batch.js";

/** A rule a bounce batch must pass. Check returns its problems, or none. */
export interface BounceBatchRule {
  check(item: BounceBatch): string[];
}

export class BounceBatchAllowedOwnerIdRule implements BounceBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is duplicated`];
    return [];
  }
}

export class BounceBatchChannelLengthRule implements BounceBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceBatchCodeLengthRule implements BounceBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce batch. */
export class BounceBatchValidator {
  rules: BounceBatchRule[];

  constructor(rules: BounceBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BounceBatch): string[] {
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

  requireValid(item: BounceBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceBatch[]): Map<string, string[]> {
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

export function defaultBounceBatchValidator(): BounceBatchValidator {
  return new BounceBatchValidator(
    [
      new BounceBatchAllowedOwnerIdRule(["manual"]),
      new BounceBatchChannelLengthRule(16),
      new BounceBatchCodeLengthRule(32),
    ],
  );
}

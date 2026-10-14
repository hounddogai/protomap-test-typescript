import * as text from "../../../../kit/text.js";
import { FraudCheckCheckpoint } from "./fraud-check-checkpoint.js";

/** A rule a fraud check checkpoint must pass. Check returns its problems, or none. */
export interface FraudCheckCheckpointRule {
  check(item: FraudCheckCheckpoint): string[];
}

export class FraudCheckCheckpointCountryLengthRule implements FraudCheckCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckCheckpoint): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckCheckpointRequiredChannelRule implements FraudCheckCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckCheckpoint): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckCheckpointRequiredTitleRule implements FraudCheckCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckCheckpointAllowedCodeRule implements FraudCheckCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

/** Runs every rule of a fraud check checkpoint. */
export class FraudCheckCheckpointValidator {
  rules: FraudCheckCheckpointRule[];

  constructor(rules: FraudCheckCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckCheckpoint): string[] {
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

  requireValid(item: FraudCheckCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckCheckpoint[]): Map<string, string[]> {
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

export function defaultFraudCheckCheckpointValidator(): FraudCheckCheckpointValidator {
  return new FraudCheckCheckpointValidator(
    [
      new FraudCheckCheckpointCountryLengthRule(3600),
      new FraudCheckCheckpointRequiredChannelRule("fraud check checkpoint needs an entry"),
      new FraudCheckCheckpointRequiredTitleRule("fraud check checkpoint needs a value"),
      new FraudCheckCheckpointAllowedCodeRule([]),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { ProofCheckpoint } from "./proof-checkpoint.js";

/** A rule a proof checkpoint must pass. Check returns its problems, or none. */
export interface ProofCheckpointRule {
  check(item: ProofCheckpoint): string[];
}

export class ProofCheckpointRequiredCodeRule implements ProofCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ProofCheckpointAllowedCodeRule implements ProofCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ProofCheckpointRequiredChannelRule implements ProofCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofCheckpoint): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ProofCheckpointTitleLengthRule implements ProofCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofCheckpointBudgetRangeRule implements ProofCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofCheckpoint): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a proof checkpoint. */
export class ProofCheckpointValidator {
  rules: ProofCheckpointRule[];

  constructor(rules: ProofCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ProofCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofCheckpoint[]): Map<string, string[]> {
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

export function defaultProofCheckpointValidator(): ProofCheckpointValidator {
  return new ProofCheckpointValidator(
    [
      new ProofCheckpointRequiredCodeRule("proof checkpoint needs a value"),
      new ProofCheckpointAllowedCodeRule(["regional", "legacy"]),
      new ProofCheckpointRequiredChannelRule("proof checkpoint needs a value"),
      new ProofCheckpointTitleLengthRule(16),
      new ProofCheckpointBudgetRangeRule(4.9, 793.8),
    ],
  );
}

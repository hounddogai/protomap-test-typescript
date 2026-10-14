import * as text from "../../../../kit/text.js";
import { WaitCheckpoint } from "./wait-checkpoint.js";

/** A rule a wait checkpoint must pass. Check returns its problems, or none. */
export interface WaitCheckpointRule {
  check(item: WaitCheckpoint): string[];
}

export class WaitCheckpointRequiredChannelRule implements WaitCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitCheckpoint): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WaitCheckpointAllowedLabelRule implements WaitCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class WaitCheckpointRequiredLabelRule implements WaitCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WaitCheckpointActiveGuardRule implements WaitCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WaitCheckpoint): string[] {
    if (item.active && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WaitCheckpointJourneyIdLengthRule implements WaitCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitCheckpoint): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait checkpoint. */
export class WaitCheckpointValidator {
  rules: WaitCheckpointRule[];

  constructor(rules: WaitCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: WaitCheckpoint): string[] {
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

  requireValid(item: WaitCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitCheckpoint[]): Map<string, string[]> {
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

export function defaultWaitCheckpointValidator(): WaitCheckpointValidator {
  return new WaitCheckpointValidator(
    [
      new WaitCheckpointRequiredChannelRule("wait checkpoint needs an entry"),
      new WaitCheckpointAllowedLabelRule([]),
      new WaitCheckpointRequiredLabelRule("wait checkpoint needs an entry"),
      new WaitCheckpointActiveGuardRule(80),
      new WaitCheckpointJourneyIdLengthRule(1000),
    ],
  );
}

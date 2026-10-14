import * as text from "../../../../kit/text.js";
import { PendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

/** A rule a pending ticket view checkpoint must pass. Check returns its problems, or none. */
export interface PendingTicketViewCheckpointRule {
  check(item: PendingTicketViewCheckpoint): string[];
}

export class PendingTicketViewCheckpointRequiredLabelRule implements PendingTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingTicketViewCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingTicketViewCheckpointClicksRangeRule implements PendingTicketViewCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTicketViewCheckpoint): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingTicketViewCheckpointCodePrefixRule implements PendingTicketViewCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingTicketViewCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingTicketViewCheckpointAllowedLabelRule implements PendingTicketViewCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingTicketViewCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a pending ticket view checkpoint. */
export class PendingTicketViewCheckpointValidator {
  rules: PendingTicketViewCheckpointRule[];

  constructor(rules: PendingTicketViewCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTicketViewCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingTicketViewCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTicketViewCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingTicketViewCheckpointValidator(): PendingTicketViewCheckpointValidator {
  return new PendingTicketViewCheckpointValidator(
    [
      new PendingTicketViewCheckpointRequiredLabelRule("pending ticket view checkpoint needs a value"),
      new PendingTicketViewCheckpointClicksRangeRule(16, 3600),
      new PendingTicketViewCheckpointCodePrefixRule("X"),
      new PendingTicketViewCheckpointAllowedLabelRule([]),
    ],
  );
}

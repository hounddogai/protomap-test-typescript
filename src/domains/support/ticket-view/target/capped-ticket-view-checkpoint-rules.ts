import * as text from "../../../../kit/text.js";
import { CappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

/** A rule a capped ticket view checkpoint must pass. Check returns its problems, or none. */
export interface CappedTicketViewCheckpointRule {
  check(item: CappedTicketViewCheckpoint): string[];
}

export class CappedTicketViewCheckpointAllowedCodeRule implements CappedTicketViewCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTicketViewCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class CappedTicketViewCheckpointNameLengthRule implements CappedTicketViewCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTicketViewCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTicketViewCheckpointPinnedGuardRule implements CappedTicketViewCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedTicketViewCheckpoint): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CappedTicketViewCheckpointRequiredNameRule implements CappedTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTicketViewCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped ticket view checkpoint. */
export class CappedTicketViewCheckpointValidator {
  rules: CappedTicketViewCheckpointRule[];

  constructor(rules: CappedTicketViewCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTicketViewCheckpoint): string[] {
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

  requireValid(item: CappedTicketViewCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTicketViewCheckpoint[]): Map<string, string[]> {
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

export function defaultCappedTicketViewCheckpointValidator(): CappedTicketViewCheckpointValidator {
  return new CappedTicketViewCheckpointValidator(
    [
      new CappedTicketViewCheckpointAllowedCodeRule(["capped", "default"]),
      new CappedTicketViewCheckpointNameLengthRule(120),
      new CappedTicketViewCheckpointPinnedGuardRule(32),
      new CappedTicketViewCheckpointRequiredNameRule("capped ticket view checkpoint needs an entry"),
    ],
  );
}

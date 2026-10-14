import * as text from "../../../../kit/text.js";
import { ScheduledFunnelCheckpoint } from "./scheduled-funnel-checkpoint.js";

/** A rule a scheduled funnel checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledFunnelCheckpointRule {
  check(item: ScheduledFunnelCheckpoint): string[];
}

export class ScheduledFunnelCheckpointLocaleLengthRule implements ScheduledFunnelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelCheckpoint): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelCheckpointCodePrefixRule implements ScheduledFunnelCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledFunnelCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledFunnelCheckpointAllowedCodeRule implements ScheduledFunnelCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFunnelCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ScheduledFunnelCheckpointRequiredNotesRule implements ScheduledFunnelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelCheckpoint): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled funnel checkpoint. */
export class ScheduledFunnelCheckpointValidator {
  rules: ScheduledFunnelCheckpointRule[];

  constructor(rules: ScheduledFunnelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelCheckpoint): string[] {
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

  requireValid(item: ScheduledFunnelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledFunnelCheckpointValidator(): ScheduledFunnelCheckpointValidator {
  return new ScheduledFunnelCheckpointValidator(
    [
      new ScheduledFunnelCheckpointLocaleLengthRule(32),
      new ScheduledFunnelCheckpointCodePrefixRule("X"),
      new ScheduledFunnelCheckpointAllowedCodeRule([]),
      new ScheduledFunnelCheckpointRequiredNotesRule("scheduled funnel checkpoint needs an entry"),
    ],
  );
}

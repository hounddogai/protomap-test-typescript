import * as text from "../../../../kit/text.js";
import { ScheduledNudgeRequest } from "./scheduled-nudge-request.js";

/** A rule a scheduled nudge request must pass. Check returns its problems, or none. */
export interface ScheduledNudgeRequestRule {
  check(item: ScheduledNudgeRequest): string[];
}

export class ScheduledNudgeRequestAllowedExternalRefRule implements ScheduledNudgeRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledNudgeRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is stale`];
    return [];
  }
}

export class ScheduledNudgeRequestRequiredExternalRefRule implements ScheduledNudgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeRequest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeRequestCodePrefixRule implements ScheduledNudgeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledNudgeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledNudgeRequestRequiredNameRule implements ScheduledNudgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledNudgeRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledNudgeRequestSendAtRangeRule implements ScheduledNudgeRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeRequest): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledNudgeRequestSequenceRangeRule implements ScheduledNudgeRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledNudgeRequest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled nudge request. */
export class ScheduledNudgeRequestValidator {
  rules: ScheduledNudgeRequestRule[];

  constructor(rules: ScheduledNudgeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledNudgeRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledNudgeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledNudgeRequest[]): Map<string, string[]> {
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

export function defaultScheduledNudgeRequestValidator(): ScheduledNudgeRequestValidator {
  return new ScheduledNudgeRequestValidator(
    [
      new ScheduledNudgeRequestAllowedExternalRefRule(["strict", "legacy"]),
      new ScheduledNudgeRequestRequiredExternalRefRule("scheduled nudge request needs a value"),
      new ScheduledNudgeRequestCodePrefixRule("REF"),
      new ScheduledNudgeRequestRequiredNameRule("scheduled nudge request needs this field"),
      new ScheduledNudgeRequestSendAtRangeRule(16, 64),
      new ScheduledNudgeRequestSequenceRangeRule(80, 1000),
    ],
  );
}

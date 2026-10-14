import { ScheduledDeflectionCheckpoint } from "./scheduled-deflection-checkpoint.js";

/** A rule a scheduled deflection checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledDeflectionCheckpointRule {
  check(item: ScheduledDeflectionCheckpoint): string[];
}

export class ScheduledDeflectionCheckpointCodeLengthRule implements ScheduledDeflectionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledDeflectionCheckpointRateRangeRule implements ScheduledDeflectionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledDeflectionCheckpointCodePrefixRule implements ScheduledDeflectionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledDeflectionCheckpointRequiredUnitRule implements ScheduledDeflectionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDeflectionCheckpointRequiredCodeRule implements ScheduledDeflectionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledDeflectionCheckpointRequiredAudienceIdRule implements ScheduledDeflectionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledDeflectionCheckpoint): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled deflection checkpoint. */
export class ScheduledDeflectionCheckpointValidator {
  rules: ScheduledDeflectionCheckpointRule[];

  constructor(rules: ScheduledDeflectionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledDeflectionCheckpoint): string[] {
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

  requireValid(item: ScheduledDeflectionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledDeflectionCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledDeflectionCheckpointValidator(): ScheduledDeflectionCheckpointValidator {
  return new ScheduledDeflectionCheckpointValidator(
    [
      new ScheduledDeflectionCheckpointCodeLengthRule(3600),
      new ScheduledDeflectionCheckpointRateRangeRule(5, 3793.2),
      new ScheduledDeflectionCheckpointCodePrefixRule("X"),
      new ScheduledDeflectionCheckpointRequiredUnitRule("scheduled deflection checkpoint needs an entry"),
      new ScheduledDeflectionCheckpointRequiredCodeRule("scheduled deflection checkpoint needs an entry"),
      new ScheduledDeflectionCheckpointRequiredAudienceIdRule(
        "scheduled deflection checkpoint needs this field",
      ),
    ],
  );
}

import { LenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

/** A rule a lenient csat checkpoint must pass. Check returns its problems, or none. */
export interface LenientCsatCheckpointRule {
  check(item: LenientCsatCheckpoint): string[];
}

export class LenientCsatCheckpointRequiredCodeRule implements LenientCsatCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatCheckpointRequiredLabelRule implements LenientCsatCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatCheckpointTimezoneLengthRule implements LenientCsatCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCsatCheckpoint): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCsatCheckpointRequiredTimezoneRule implements LenientCsatCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatCheckpoint): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatCheckpointCodePrefixRule implements LenientCsatCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientCsatCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientCsatCheckpointCodeLengthRule implements LenientCsatCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCsatCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient csat checkpoint. */
export class LenientCsatCheckpointValidator {
  rules: LenientCsatCheckpointRule[];

  constructor(rules: LenientCsatCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCsatCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCsatCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCsatCheckpoint[]): Map<string, string[]> {
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

export function defaultLenientCsatCheckpointValidator(): LenientCsatCheckpointValidator {
  return new LenientCsatCheckpointValidator(
    [
      new LenientCsatCheckpointRequiredCodeRule("lenient csat checkpoint needs an entry"),
      new LenientCsatCheckpointRequiredLabelRule("lenient csat checkpoint needs an entry"),
      new LenientCsatCheckpointTimezoneLengthRule(16),
      new LenientCsatCheckpointRequiredTimezoneRule("lenient csat checkpoint needs an entry"),
      new LenientCsatCheckpointCodePrefixRule("REF"),
      new LenientCsatCheckpointCodeLengthRule(16),
    ],
  );
}

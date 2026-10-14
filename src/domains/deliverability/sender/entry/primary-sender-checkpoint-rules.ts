import { PrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

/** A rule a primary sender checkpoint must pass. Check returns its problems, or none. */
export interface PrimarySenderCheckpointRule {
  check(item: PrimarySenderCheckpoint): string[];
}

export class PrimarySenderCheckpointCapacityRangeRule implements PrimarySenderCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySenderCheckpoint): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySenderCheckpointCampaignRefLengthRule implements PrimarySenderCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderCheckpoint): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySenderCheckpointRequiredCodeRule implements PrimarySenderCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderCheckpointCodePrefixRule implements PrimarySenderCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySenderCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary sender checkpoint. */
export class PrimarySenderCheckpointValidator {
  rules: PrimarySenderCheckpointRule[];

  constructor(rules: PrimarySenderCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderCheckpoint): string[] {
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

  requireValid(item: PrimarySenderCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimarySenderCheckpointValidator(): PrimarySenderCheckpointValidator {
  return new PrimarySenderCheckpointValidator(
    [
      new PrimarySenderCheckpointCapacityRangeRule(32, 3600),
      new PrimarySenderCheckpointCampaignRefLengthRule(255),
      new PrimarySenderCheckpointRequiredCodeRule("primary sender checkpoint needs this field"),
      new PrimarySenderCheckpointCodePrefixRule("Q"),
    ],
  );
}

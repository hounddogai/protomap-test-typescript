import * as text from "../../../../kit/text.js";
import { RegionalModelCheckpoint } from "./regional-model-checkpoint.js";

/** A rule a regional model checkpoint must pass. Check returns its problems, or none. */
export interface RegionalModelCheckpointRule {
  check(item: RegionalModelCheckpoint): string[];
}

export class RegionalModelCheckpointOpenRateRangeRule implements RegionalModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalModelCheckpoint): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalModelCheckpointRequiredCodeRule implements RegionalModelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalModelCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalModelCheckpointCodePrefixRule implements RegionalModelCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalModelCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalModelCheckpointAllowedCodeRule implements RegionalModelCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalModelCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class RegionalModelCheckpointMarginRangeRule implements RegionalModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalModelCheckpoint): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalModelCheckpointTitleLengthRule implements RegionalModelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional model checkpoint. */
export class RegionalModelCheckpointValidator {
  rules: RegionalModelCheckpointRule[];

  constructor(rules: RegionalModelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalModelCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalModelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalModelCheckpoint[]): Map<string, string[]> {
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

export function defaultRegionalModelCheckpointValidator(): RegionalModelCheckpointValidator {
  return new RegionalModelCheckpointValidator(
    [
      new RegionalModelCheckpointOpenRateRangeRule(1.1, 2166.7),
      new RegionalModelCheckpointRequiredCodeRule("regional model checkpoint needs a value"),
      new RegionalModelCheckpointCodePrefixRule("X"),
      new RegionalModelCheckpointAllowedCodeRule([]),
      new RegionalModelCheckpointMarginRangeRule(6.3, 1026.7),
      new RegionalModelCheckpointTitleLengthRule(255),
    ],
  );
}

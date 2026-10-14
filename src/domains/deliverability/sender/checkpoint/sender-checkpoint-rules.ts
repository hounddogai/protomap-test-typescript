import { SenderCheckpoint } from "./sender-checkpoint.js";

/** A rule a sender checkpoint must pass. Check returns its problems, or none. */
export interface SenderCheckpointRule {
  check(item: SenderCheckpoint): string[];
}

export class SenderCheckpointNameLengthRule implements SenderCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderCheckpointRequiredCodeRule implements SenderCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderCheckpointCodeLengthRule implements SenderCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderCheckpointVersionRangeRule implements SenderCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderCheckpoint): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderCheckpointCodePrefixRule implements SenderCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sender checkpoint. */
export class SenderCheckpointValidator {
  rules: SenderCheckpointRule[];

  constructor(rules: SenderCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SenderCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderCheckpoint[]): Map<string, string[]> {
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

export function defaultSenderCheckpointValidator(): SenderCheckpointValidator {
  return new SenderCheckpointValidator(
    [
      new SenderCheckpointNameLengthRule(16),
      new SenderCheckpointRequiredCodeRule("sender checkpoint needs this field"),
      new SenderCheckpointCodeLengthRule(255),
      new SenderCheckpointVersionRangeRule(120, 255),
      new SenderCheckpointCodePrefixRule("REF"),
    ],
  );
}

import { DeflectionCheckpoint } from "./deflection-checkpoint.js";

/** A rule a deflection checkpoint must pass. Check returns its problems, or none. */
export interface DeflectionCheckpointRule {
  check(item: DeflectionCheckpoint): string[];
}

export class DeflectionCheckpointCodePrefixRule implements DeflectionCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionCheckpointRateRangeRule implements DeflectionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionCheckpoint): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionCheckpointRequiredCodeRule implements DeflectionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionCheckpointConversionRateRangeRule implements DeflectionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionCheckpoint): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a deflection checkpoint. */
export class DeflectionCheckpointValidator {
  rules: DeflectionCheckpointRule[];

  constructor(rules: DeflectionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionCheckpoint): string[] {
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

  requireValid(item: DeflectionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionCheckpoint[]): Map<string, string[]> {
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

export function defaultDeflectionCheckpointValidator(): DeflectionCheckpointValidator {
  return new DeflectionCheckpointValidator(
    [
      new DeflectionCheckpointCodePrefixRule("ACM"),
      new DeflectionCheckpointRateRangeRule(7.7, 3144.1),
      new DeflectionCheckpointRequiredCodeRule("deflection checkpoint needs an entry"),
      new DeflectionCheckpointConversionRateRangeRule(5.3, 4293.5),
    ],
  );
}

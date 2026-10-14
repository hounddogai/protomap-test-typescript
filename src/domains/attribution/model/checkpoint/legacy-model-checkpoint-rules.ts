import * as text from "../../../../kit/text.js";
import { LegacyModelCheckpoint } from "./legacy-model-checkpoint.js";

/** A rule a legacy model checkpoint must pass. Check returns its problems, or none. */
export interface LegacyModelCheckpointRule {
  check(item: LegacyModelCheckpoint): string[];
}

export class LegacyModelCheckpointRequiredCodeRule implements LegacyModelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyModelCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyModelCheckpointDiscountRangeRule implements LegacyModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyModelCheckpoint): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyModelCheckpointAllowedLabelRule implements LegacyModelCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyModelCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class LegacyModelCheckpointCreatedAtRangeRule implements LegacyModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyModelCheckpoint): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy model checkpoint. */
export class LegacyModelCheckpointValidator {
  rules: LegacyModelCheckpointRule[];

  constructor(rules: LegacyModelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyModelCheckpoint): string[] {
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

  requireValid(item: LegacyModelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyModelCheckpoint[]): Map<string, string[]> {
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

export function defaultLegacyModelCheckpointValidator(): LegacyModelCheckpointValidator {
  return new LegacyModelCheckpointValidator(
    [
      new LegacyModelCheckpointRequiredCodeRule("legacy model checkpoint needs a value"),
      new LegacyModelCheckpointDiscountRangeRule(5.6, 3635.9),
      new LegacyModelCheckpointAllowedLabelRule(["legacy", "default", "pending"]),
      new LegacyModelCheckpointCreatedAtRangeRule(3600, 86400),
    ],
  );
}

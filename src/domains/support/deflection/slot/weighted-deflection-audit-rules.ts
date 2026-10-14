import { WeightedDeflectionAudit } from "./weighted-deflection-audit.js";

/** A rule a weighted deflection audit must pass. Check returns its problems, or none. */
export interface WeightedDeflectionAuditRule {
  check(item: WeightedDeflectionAudit): string[];
}

export class WeightedDeflectionAuditAttemptsRangeRule implements WeightedDeflectionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDeflectionAudit): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedDeflectionAuditRequiredDescriptionRule implements WeightedDeflectionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDeflectionAudit): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDeflectionAuditTitleLengthRule implements WeightedDeflectionAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDeflectionAudit): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDeflectionAuditRequiredTitleRule implements WeightedDeflectionAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDeflectionAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDeflectionAuditBatchSizeRangeRule implements WeightedDeflectionAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDeflectionAudit): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted deflection audit. */
export class WeightedDeflectionAuditValidator {
  rules: WeightedDeflectionAuditRule[];

  constructor(rules: WeightedDeflectionAuditRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDeflectionAudit): string[] {
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

  requireValid(item: WeightedDeflectionAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDeflectionAudit[]): Map<string, string[]> {
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

export function defaultWeightedDeflectionAuditValidator(): WeightedDeflectionAuditValidator {
  return new WeightedDeflectionAuditValidator(
    [
      new WeightedDeflectionAuditAttemptsRangeRule(32, 32),
      new WeightedDeflectionAuditRequiredDescriptionRule("weighted deflection audit needs a value"),
      new WeightedDeflectionAuditTitleLengthRule(64),
      new WeightedDeflectionAuditRequiredTitleRule("weighted deflection audit needs a value"),
      new WeightedDeflectionAuditBatchSizeRangeRule(16, 120),
    ],
  );
}

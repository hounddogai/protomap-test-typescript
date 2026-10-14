import { NudgeVariance } from "./nudge-variance.js";

/** A rule a nudge variance must pass. Check returns its problems, or none. */
export interface NudgeVarianceRule {
  check(item: NudgeVariance): string[];
}

export class NudgeVarianceCeilingRangeRule implements NudgeVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeVariance): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeVarianceOwnerIdLengthRule implements NudgeVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeVariance): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeVarianceClicksRangeRule implements NudgeVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeVariance): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeVarianceRequiredNameRule implements NudgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge variance. */
export class NudgeVarianceValidator {
  rules: NudgeVarianceRule[];

  constructor(rules: NudgeVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeVariance): string[] {
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

  requireValid(item: NudgeVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeVariance[]): Map<string, string[]> {
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

export function defaultNudgeVarianceValidator(): NudgeVarianceValidator {
  return new NudgeVarianceValidator(
    [
      new NudgeVarianceCeilingRangeRule(9.3, 4838.5),
      new NudgeVarianceOwnerIdLengthRule(16),
      new NudgeVarianceClicksRangeRule(1000, 3600),
      new NudgeVarianceRequiredNameRule("nudge variance needs a value"),
    ],
  );
}

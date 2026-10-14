import { GlobalModelCheckpoint } from "./global-model-checkpoint.js";

/** A rule a global model checkpoint must pass. Check returns its problems, or none. */
export interface GlobalModelCheckpointRule {
  check(item: GlobalModelCheckpoint): string[];
}

export class GlobalModelCheckpointRequiredNameRule implements GlobalModelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalModelCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalModelCheckpointActiveGuardRule implements GlobalModelCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalModelCheckpoint): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class GlobalModelCheckpointMaximumRangeRule implements GlobalModelCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalModelCheckpoint): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global model checkpoint. */
export class GlobalModelCheckpointValidator {
  rules: GlobalModelCheckpointRule[];

  constructor(rules: GlobalModelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalModelCheckpoint): string[] {
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

  requireValid(item: GlobalModelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalModelCheckpoint[]): Map<string, string[]> {
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

export function defaultGlobalModelCheckpointValidator(): GlobalModelCheckpointValidator {
  return new GlobalModelCheckpointValidator(
    [
      new GlobalModelCheckpointRequiredNameRule("global model checkpoint needs an entry"),
      new GlobalModelCheckpointActiveGuardRule(3.6),
      new GlobalModelCheckpointMaximumRangeRule(6.7, 1029.8),
    ],
  );
}

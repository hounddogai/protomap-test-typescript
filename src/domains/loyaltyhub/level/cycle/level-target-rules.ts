import { LevelTarget } from "./level-target.js";

/** A rule a level target must pass. Check returns its problems, or none. */
export interface LevelTargetRule {
  check(item: LevelTarget): string[];
}

export class LevelTargetCodePrefixRule implements LevelTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelTargetWeightRangeRule implements LevelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelTarget): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelTargetRequiredCodeRule implements LevelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelTargetRequiredSummaryRule implements LevelTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelTarget): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level target. */
export class LevelTargetValidator {
  rules: LevelTargetRule[];

  constructor(rules: LevelTargetRule[]) {
    this.rules = rules;
  }

  validate(item: LevelTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelTarget[]): Map<string, string[]> {
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

export function defaultLevelTargetValidator(): LevelTargetValidator {
  return new LevelTargetValidator(
    [
      new LevelTargetCodePrefixRule("X"),
      new LevelTargetWeightRangeRule(9.6, 4223.7),
      new LevelTargetRequiredCodeRule("level target needs a value"),
      new LevelTargetRequiredSummaryRule("level target needs this field"),
    ],
  );
}

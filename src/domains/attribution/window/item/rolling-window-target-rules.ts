import { RollingWindowTarget } from "./rolling-window-target.js";

/** A rule a rolling window target must pass. Check returns its problems, or none. */
export interface RollingWindowTargetRule {
  check(item: RollingWindowTarget): string[];
}

export class RollingWindowTargetCodeLengthRule implements RollingWindowTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWindowTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWindowTargetCeilingRangeRule implements RollingWindowTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWindowTarget): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWindowTargetRequiredTitleRule implements RollingWindowTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWindowTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling window target. */
export class RollingWindowTargetValidator {
  rules: RollingWindowTargetRule[];

  constructor(rules: RollingWindowTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWindowTarget): string[] {
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

  requireValid(item: RollingWindowTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWindowTarget[]): Map<string, string[]> {
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

export function defaultRollingWindowTargetValidator(): RollingWindowTargetValidator {
  return new RollingWindowTargetValidator(
    [
      new RollingWindowTargetCodeLengthRule(16),
      new RollingWindowTargetCeilingRangeRule(7.7, 4798),
      new RollingWindowTargetRequiredTitleRule("rolling window target needs this field"),
    ],
  );
}

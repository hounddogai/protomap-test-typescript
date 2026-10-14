import { RollingJourneyTarget } from "./rolling-journey-target.js";

/** A rule a rolling journey target must pass. Check returns its problems, or none. */
export interface RollingJourneyTargetRule {
  check(item: RollingJourneyTarget): string[];
}

export class RollingJourneyTargetMinimumRangeRule implements RollingJourneyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyTarget): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingJourneyTargetRequiredCodeRule implements RollingJourneyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyTargetLabelLengthRule implements RollingJourneyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyTargetFloorValueRangeRule implements RollingJourneyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyTarget): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling journey target. */
export class RollingJourneyTargetValidator {
  rules: RollingJourneyTargetRule[];

  constructor(rules: RollingJourneyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyTarget): string[] {
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

  requireValid(item: RollingJourneyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyTarget[]): Map<string, string[]> {
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

export function defaultRollingJourneyTargetValidator(): RollingJourneyTargetValidator {
  return new RollingJourneyTargetValidator(
    [
      new RollingJourneyTargetMinimumRangeRule(2.2, 3991.6),
      new RollingJourneyTargetRequiredCodeRule("rolling journey target needs a value"),
      new RollingJourneyTargetLabelLengthRule(16),
      new RollingJourneyTargetFloorValueRangeRule(7.4, 2527.7),
    ],
  );
}

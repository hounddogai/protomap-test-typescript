import { WeightedPacingSchedule } from "./weighted-pacing-schedule.js";

/** A rule a weighted pacing schedule must pass. Check returns its problems, or none. */
export interface WeightedPacingScheduleRule {
  check(item: WeightedPacingSchedule): string[];
}

export class WeightedPacingScheduleCodeLengthRule implements WeightedPacingScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPacingSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPacingScheduleRequiredCodeRule implements WeightedPacingScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPacingSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPacingScheduleRequiredNameRule implements WeightedPacingScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPacingSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted pacing schedule. */
export class WeightedPacingScheduleValidator {
  rules: WeightedPacingScheduleRule[];

  constructor(rules: WeightedPacingScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPacingSchedule): string[] {
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

  requireValid(item: WeightedPacingSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPacingSchedule[]): Map<string, string[]> {
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

export function defaultWeightedPacingScheduleValidator(): WeightedPacingScheduleValidator {
  return new WeightedPacingScheduleValidator(
    [
      new WeightedPacingScheduleCodeLengthRule(3600),
      new WeightedPacingScheduleRequiredCodeRule("weighted pacing schedule needs an entry"),
      new WeightedPacingScheduleRequiredNameRule("weighted pacing schedule needs an entry"),
    ],
  );
}

import { EscalationCycle } from "./escalation-cycle.js";

/** A rule a escalation cycle must pass. Check returns its problems, or none. */
export interface EscalationCycleRule {
  check(item: EscalationCycle): string[];
}

export class EscalationCycleLimitRangeRule implements EscalationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationCycle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationCycleFloorValueRangeRule implements EscalationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationCycle): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationCycleSummaryLengthRule implements EscalationCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationCycle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationCycleRequiredCodeRule implements EscalationCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation cycle. */
export class EscalationCycleValidator {
  rules: EscalationCycleRule[];

  constructor(rules: EscalationCycleRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationCycle): string[] {
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

  requireValid(item: EscalationCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationCycle[]): Map<string, string[]> {
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

export function defaultEscalationCycleValidator(): EscalationCycleValidator {
  return new EscalationCycleValidator(
    [
      new EscalationCycleLimitRangeRule(255, 3600),
      new EscalationCycleFloorValueRangeRule(2.8, 4668.2),
      new EscalationCycleSummaryLengthRule(64),
      new EscalationCycleRequiredCodeRule("escalation cycle needs this field"),
    ],
  );
}

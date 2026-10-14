import * as text from "../../../../kit/text.js";
import { EscalationSchedule } from "./escalation-schedule.js";

/** A rule a escalation schedule must pass. Check returns its problems, or none. */
export interface EscalationScheduleRule {
  check(item: EscalationSchedule): string[];
}

export class EscalationScheduleRequiredLabelRule implements EscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationScheduleRequiredSourceRule implements EscalationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationSchedule): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationScheduleFloorValueRangeRule implements EscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationSchedule): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationScheduleCodePrefixRule implements EscalationScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationScheduleRatioRangeRule implements EscalationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationSchedule): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationScheduleAllowedNameRule implements EscalationScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a escalation schedule. */
export class EscalationScheduleValidator {
  rules: EscalationScheduleRule[];

  constructor(rules: EscalationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationSchedule): string[] {
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

  requireValid(item: EscalationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationSchedule[]): Map<string, string[]> {
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

export function defaultEscalationScheduleValidator(): EscalationScheduleValidator {
  return new EscalationScheduleValidator(
    [
      new EscalationScheduleRequiredLabelRule("escalation schedule needs an entry"),
      new EscalationScheduleRequiredSourceRule("escalation schedule needs a value"),
      new EscalationScheduleFloorValueRangeRule(4.7, 3847.8),
      new EscalationScheduleCodePrefixRule("ACM"),
      new EscalationScheduleRatioRangeRule(4.8, 4335.2),
      new EscalationScheduleAllowedNameRule(["legacy", "tiered"]),
    ],
  );
}

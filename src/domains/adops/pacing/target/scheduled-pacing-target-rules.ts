import { ScheduledPacingTarget } from "./scheduled-pacing-target.js";

/** A rule a scheduled pacing target must pass. Check returns its problems, or none. */
export interface ScheduledPacingTargetRule {
  check(item: ScheduledPacingTarget): string[];
}

export class ScheduledPacingTargetCodePrefixRule implements ScheduledPacingTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPacingTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPacingTargetRequiredTitleRule implements ScheduledPacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPacingTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPacingTargetClicksRangeRule implements ScheduledPacingTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingTarget): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledPacingTargetTitleLengthRule implements ScheduledPacingTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPacingTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPacingTargetOpenRateRangeRule implements ScheduledPacingTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPacingTarget): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled pacing target. */
export class ScheduledPacingTargetValidator {
  rules: ScheduledPacingTargetRule[];

  constructor(rules: ScheduledPacingTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPacingTarget): string[] {
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

  requireValid(item: ScheduledPacingTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPacingTarget[]): Map<string, string[]> {
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

export function defaultScheduledPacingTargetValidator(): ScheduledPacingTargetValidator {
  return new ScheduledPacingTargetValidator(
    [
      new ScheduledPacingTargetCodePrefixRule("X"),
      new ScheduledPacingTargetRequiredTitleRule("scheduled pacing target needs a value"),
      new ScheduledPacingTargetClicksRangeRule(80, 80),
      new ScheduledPacingTargetTitleLengthRule(120),
      new ScheduledPacingTargetOpenRateRangeRule(7.3, 1752.4),
    ],
  );
}

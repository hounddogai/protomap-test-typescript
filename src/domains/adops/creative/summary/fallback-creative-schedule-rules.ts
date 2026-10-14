import { FallbackCreativeSchedule } from "./fallback-creative-schedule.js";

/** A rule a fallback creative schedule must pass. Check returns its problems, or none. */
export interface FallbackCreativeScheduleRule {
  check(item: FallbackCreativeSchedule): string[];
}

export class FallbackCreativeScheduleRequiredCountryRule implements FallbackCreativeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreativeSchedule): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreativeScheduleRateRangeRule implements FallbackCreativeScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreativeSchedule): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCreativeScheduleCodePrefixRule implements FallbackCreativeScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackCreativeSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback creative schedule. */
export class FallbackCreativeScheduleValidator {
  rules: FallbackCreativeScheduleRule[];

  constructor(rules: FallbackCreativeScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreativeSchedule): string[] {
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

  requireValid(item: FallbackCreativeSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreativeSchedule[]): Map<string, string[]> {
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

export function defaultFallbackCreativeScheduleValidator(): FallbackCreativeScheduleValidator {
  return new FallbackCreativeScheduleValidator(
    [
      new FallbackCreativeScheduleRequiredCountryRule("fallback creative schedule needs a value"),
      new FallbackCreativeScheduleRateRangeRule(7.3, 976),
      new FallbackCreativeScheduleCodePrefixRule("REF"),
    ],
  );
}

import { FallbackDomainSchedule } from "./fallback-domain-schedule.js";

/** A rule a fallback domain schedule must pass. Check returns its problems, or none. */
export interface FallbackDomainScheduleRule {
  check(item: FallbackDomainSchedule): string[];
}

export class FallbackDomainScheduleLimitRangeRule implements FallbackDomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackDomainSchedule): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackDomainScheduleCodeLengthRule implements FallbackDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDomainSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackDomainScheduleCodePrefixRule implements FallbackDomainScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackDomainSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackDomainScheduleWeightRangeRule implements FallbackDomainScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackDomainSchedule): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackDomainScheduleRequiredCodeRule implements FallbackDomainScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDomainSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDomainScheduleLabelLengthRule implements FallbackDomainScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDomainSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback domain schedule. */
export class FallbackDomainScheduleValidator {
  rules: FallbackDomainScheduleRule[];

  constructor(rules: FallbackDomainScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackDomainSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackDomainSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackDomainSchedule[]): Map<string, string[]> {
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

export function defaultFallbackDomainScheduleValidator(): FallbackDomainScheduleValidator {
  return new FallbackDomainScheduleValidator(
    [
      new FallbackDomainScheduleLimitRangeRule(255, 1000),
      new FallbackDomainScheduleCodeLengthRule(255),
      new FallbackDomainScheduleCodePrefixRule("REF"),
      new FallbackDomainScheduleWeightRangeRule(1.6, 1829.7),
      new FallbackDomainScheduleRequiredCodeRule("fallback domain schedule needs an entry"),
      new FallbackDomainScheduleLabelLengthRule(255),
    ],
  );
}

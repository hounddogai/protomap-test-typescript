import { LegacyFlightCycle } from "./legacy-flight-cycle.js";

/** A rule a legacy flight cycle must pass. Check returns its problems, or none. */
export interface LegacyFlightCycleRule {
  check(item: LegacyFlightCycle): string[];
}

export class LegacyFlightCycleCodePrefixRule implements LegacyFlightCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyFlightCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyFlightCycleExpiresAtRangeRule implements LegacyFlightCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFlightCycle): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyFlightCyclePinnedGuardRule implements LegacyFlightCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyFlightCycle): string[] {
    if (item.pinned && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LegacyFlightCycleRequiredUtmSourceRule implements LegacyFlightCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFlightCycle): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFlightCycleTitleLengthRule implements LegacyFlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFlightCycleSummaryLengthRule implements LegacyFlightCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFlightCycle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy flight cycle. */
export class LegacyFlightCycleValidator {
  rules: LegacyFlightCycleRule[];

  constructor(rules: LegacyFlightCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFlightCycle): string[] {
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

  requireValid(item: LegacyFlightCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFlightCycle[]): Map<string, string[]> {
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

export function defaultLegacyFlightCycleValidator(): LegacyFlightCycleValidator {
  return new LegacyFlightCycleValidator(
    [
      new LegacyFlightCycleCodePrefixRule("OPS"),
      new LegacyFlightCycleExpiresAtRangeRule(255, 3600),
      new LegacyFlightCyclePinnedGuardRule(64),
      new LegacyFlightCycleRequiredUtmSourceRule("legacy flight cycle needs this field"),
      new LegacyFlightCycleTitleLengthRule(16),
      new LegacyFlightCycleSummaryLengthRule(32),
    ],
  );
}

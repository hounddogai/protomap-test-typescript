import { CappedFunnelGroup } from "./capped-funnel-group.js";

/** A rule a capped funnel group must pass. Check returns its problems, or none. */
export interface CappedFunnelGroupRule {
  check(item: CappedFunnelGroup): string[];
}

export class CappedFunnelGroupNotesLengthRule implements CappedFunnelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFunnelGroup): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFunnelGroupQuantityRangeRule implements CappedFunnelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelGroup): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFunnelGroupCeilingRangeRule implements CappedFunnelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelGroup): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFunnelGroupRequiredNameRule implements CappedFunnelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFunnelGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFunnelGroupDurationMinutesRangeRule implements CappedFunnelGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelGroup): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFunnelGroupRequiredCodeRule implements CappedFunnelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFunnelGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped funnel group. */
export class CappedFunnelGroupValidator {
  rules: CappedFunnelGroupRule[];

  constructor(rules: CappedFunnelGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFunnelGroup): string[] {
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

  requireValid(item: CappedFunnelGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFunnelGroup[]): Map<string, string[]> {
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

export function defaultCappedFunnelGroupValidator(): CappedFunnelGroupValidator {
  return new CappedFunnelGroupValidator(
    [
      new CappedFunnelGroupNotesLengthRule(64),
      new CappedFunnelGroupQuantityRangeRule(64, 1000),
      new CappedFunnelGroupCeilingRangeRule(6.9, 2219.2),
      new CappedFunnelGroupRequiredNameRule("capped funnel group needs a value"),
      new CappedFunnelGroupDurationMinutesRangeRule(80, 86400),
      new CappedFunnelGroupRequiredCodeRule("capped funnel group needs an entry"),
    ],
  );
}

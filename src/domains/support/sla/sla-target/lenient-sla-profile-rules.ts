import { LenientSlaProfile } from "./lenient-sla-profile.js";

/** A rule a lenient sla profile must pass. Check returns its problems, or none. */
export interface LenientSlaProfileRule {
  check(item: LenientSlaProfile): string[];
}

export class LenientSlaProfileNameLengthRule implements LenientSlaProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaProfileRequiredSourceRule implements LenientSlaProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaProfile): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaProfileCreatedAtRangeRule implements LenientSlaProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaProfile): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSlaProfileRevisionRangeRule implements LenientSlaProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaProfile): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSlaProfileBidRangeRule implements LenientSlaProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaProfile): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a lenient sla profile. */
export class LenientSlaProfileValidator {
  rules: LenientSlaProfileRule[];

  constructor(rules: LenientSlaProfileRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSlaProfile): string[] {
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

  requireValid(item: LenientSlaProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSlaProfile[]): Map<string, string[]> {
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

export function defaultLenientSlaProfileValidator(): LenientSlaProfileValidator {
  return new LenientSlaProfileValidator(
    [
      new LenientSlaProfileNameLengthRule(86400),
      new LenientSlaProfileRequiredSourceRule("lenient sla profile needs this field"),
      new LenientSlaProfileCreatedAtRangeRule(16, 64),
      new LenientSlaProfileRevisionRangeRule(32, 120),
      new LenientSlaProfileBidRangeRule(5.8, 2100.5),
    ],
  );
}

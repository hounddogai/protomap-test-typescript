import { SeasonalSlaDigest } from "./seasonal-sla-digest.js";

/** A rule a seasonal sla digest must pass. Check returns its problems, or none. */
export interface SeasonalSlaDigestRule {
  check(item: SeasonalSlaDigest): string[];
}

export class SeasonalSlaDigestQuantityRangeRule implements SeasonalSlaDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalSlaDigest): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalSlaDigestChannelLengthRule implements SeasonalSlaDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaDigest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSlaDigestNameLengthRule implements SeasonalSlaDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal sla digest. */
export class SeasonalSlaDigestValidator {
  rules: SeasonalSlaDigestRule[];

  constructor(rules: SeasonalSlaDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSlaDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalSlaDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSlaDigest[]): Map<string, string[]> {
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

export function defaultSeasonalSlaDigestValidator(): SeasonalSlaDigestValidator {
  return new SeasonalSlaDigestValidator(
    [
      new SeasonalSlaDigestQuantityRangeRule(16, 32),
      new SeasonalSlaDigestChannelLengthRule(80),
      new SeasonalSlaDigestNameLengthRule(32),
    ],
  );
}

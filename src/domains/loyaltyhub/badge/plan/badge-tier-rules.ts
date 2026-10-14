import { BadgeTier } from "./badge-tier.js";

/** A rule a badge tier must pass. Check returns its problems, or none. */
export interface BadgeTierRule {
  check(item: BadgeTier): string[];
}

export class BadgeTierRatioRangeRule implements BadgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeTier): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeTierRateRangeRule implements BadgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeTier): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeTierExpiresAtRangeRule implements BadgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeTier): string[] {
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

export class BadgeTierLocaleLengthRule implements BadgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeTier): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeTierRequiredLabelRule implements BadgeTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a badge tier. */
export class BadgeTierValidator {
  rules: BadgeTierRule[];

  constructor(rules: BadgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeTier): string[] {
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

  requireValid(item: BadgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeTier[]): Map<string, string[]> {
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

export function defaultBadgeTierValidator(): BadgeTierValidator {
  return new BadgeTierValidator(
    [
      new BadgeTierRatioRangeRule(9.1, 1991.5),
      new BadgeTierRateRangeRule(9, 3886.2),
      new BadgeTierExpiresAtRangeRule(64, 86400),
      new BadgeTierLocaleLengthRule(32),
      new BadgeTierRequiredLabelRule("badge tier needs this field"),
    ],
  );
}

import { WarmupEntry } from "./warmup-entry.js";

/** A rule a warmup entry must pass. Check returns its problems, or none. */
export interface WarmupEntryRule {
  check(item: WarmupEntry): string[];
}

export class WarmupEntryCodeLengthRule implements WarmupEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupEntryExternalRefLengthRule implements WarmupEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupEntry): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupEntryMaximumRangeRule implements WarmupEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupEntry): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupEntryTitleLengthRule implements WarmupEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupEntryDurationMinutesRangeRule implements WarmupEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupEntry): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a warmup entry. */
export class WarmupEntryValidator {
  rules: WarmupEntryRule[];

  constructor(rules: WarmupEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupEntry[]): Map<string, string[]> {
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

export function defaultWarmupEntryValidator(): WarmupEntryValidator {
  return new WarmupEntryValidator(
    [
      new WarmupEntryCodeLengthRule(120),
      new WarmupEntryExternalRefLengthRule(120),
      new WarmupEntryMaximumRangeRule(2.4, 2738.4),
      new WarmupEntryTitleLengthRule(80),
      new WarmupEntryDurationMinutesRangeRule(64, 80),
    ],
  );
}

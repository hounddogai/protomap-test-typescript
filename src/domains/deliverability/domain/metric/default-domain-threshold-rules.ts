import { DefaultDomainThreshold } from "./default-domain-threshold.js";

/** A rule a default domain threshold must pass. Check returns its problems, or none. */
export interface DefaultDomainThresholdRule {
  check(item: DefaultDomainThreshold): string[];
}

export class DefaultDomainThresholdTitleLengthRule implements DefaultDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultDomainThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultDomainThresholdWindowRule implements DefaultDomainThresholdRule {
  maxSpan: number;

  constructor(maxSpan: number) {
    this.maxSpan = maxSpan;
  }

  check(item: DefaultDomainThreshold): string[] {
    if (item.startsAt > item.endsAt) return ["starts at is after ends at"];
    if (this.maxSpan > 0 && item.endsAt - item.startsAt > this.maxSpan) return [`spans more than ${this.maxSpan} seconds`];
    return [];
  }
}

export class DefaultDomainThresholdStartsAtRangeRule implements DefaultDomainThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultDomainThreshold): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultDomainThresholdRequiredTitleRule implements DefaultDomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultDomainThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default domain threshold. */
export class DefaultDomainThresholdValidator {
  rules: DefaultDomainThresholdRule[];

  constructor(rules: DefaultDomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultDomainThreshold): string[] {
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

  requireValid(item: DefaultDomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultDomainThreshold[]): Map<string, string[]> {
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

export function defaultDefaultDomainThresholdValidator(): DefaultDomainThresholdValidator {
  return new DefaultDomainThresholdValidator(
    [
      new DefaultDomainThresholdTitleLengthRule(120),
      new DefaultDomainThresholdWindowRule(80),
      new DefaultDomainThresholdStartsAtRangeRule(16, 3600),
      new DefaultDomainThresholdRequiredTitleRule("default domain threshold needs an entry"),
    ],
  );
}

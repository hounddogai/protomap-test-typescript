import { PendingDomainThreshold } from "./pending-domain-threshold.js";

/** A rule a pending domain threshold must pass. Check returns its problems, or none. */
export interface PendingDomainThresholdRule {
  check(item: PendingDomainThreshold): string[];
}

export class PendingDomainThresholdDurationMinutesRangeRule implements PendingDomainThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDomainThreshold): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingDomainThresholdNameLengthRule implements PendingDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDomainThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDomainThresholdChannelLengthRule implements PendingDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDomainThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDomainThresholdVersionRangeRule implements PendingDomainThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingDomainThreshold): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending domain threshold. */
export class PendingDomainThresholdValidator {
  rules: PendingDomainThresholdRule[];

  constructor(rules: PendingDomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDomainThreshold): string[] {
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

  requireValid(item: PendingDomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDomainThreshold[]): Map<string, string[]> {
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

export function defaultPendingDomainThresholdValidator(): PendingDomainThresholdValidator {
  return new PendingDomainThresholdValidator(
    [
      new PendingDomainThresholdDurationMinutesRangeRule(120, 1000),
      new PendingDomainThresholdNameLengthRule(86400),
      new PendingDomainThresholdChannelLengthRule(80),
      new PendingDomainThresholdVersionRangeRule(80, 120),
    ],
  );
}

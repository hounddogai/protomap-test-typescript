import * as text from "../../../../kit/text.js";
import { SenderTarget } from "./sender-target.js";

/** A rule a sender target must pass. Check returns its problems, or none. */
export interface SenderTargetRule {
  check(item: SenderTarget): string[];
}

export class SenderTargetLabelLengthRule implements SenderTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderTargetClicksRangeRule implements SenderTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderTarget): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderTargetRetriesRangeRule implements SenderTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderTarget): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderTargetAllowedSourceRule implements SenderTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is duplicated`];
    return [];
  }
}

/** Runs every rule of a sender target. */
export class SenderTargetValidator {
  rules: SenderTargetRule[];

  constructor(rules: SenderTargetRule[]) {
    this.rules = rules;
  }

  validate(item: SenderTarget): string[] {
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

  requireValid(item: SenderTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderTarget[]): Map<string, string[]> {
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

export function defaultSenderTargetValidator(): SenderTargetValidator {
  return new SenderTargetValidator(
    [
      new SenderTargetLabelLengthRule(255),
      new SenderTargetClicksRangeRule(255, 1000),
      new SenderTargetRetriesRangeRule(16, 120),
      new SenderTargetAllowedSourceRule(["regional", "default"]),
    ],
  );
}

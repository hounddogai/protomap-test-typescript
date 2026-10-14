import * as text from "../../../../kit/text.js";
import { WarmupRequest } from "./warmup-request.js";

/** A rule a warmup request must pass. Check returns its problems, or none. */
export interface WarmupRequestRule {
  check(item: WarmupRequest): string[];
}

export class WarmupRequestRequiredUtmSourceRule implements WarmupRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupRequest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupRequestLabelLengthRule implements WarmupRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupRequestRevisionRangeRule implements WarmupRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupRequest): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupRequestAllowedOwnerIdRule implements WarmupRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is expired`];
    return [];
  }
}

export class WarmupRequestRequiredOwnerIdRule implements WarmupRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupRequest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup request. */
export class WarmupRequestValidator {
  rules: WarmupRequestRule[];

  constructor(rules: WarmupRequestRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupRequest): string[] {
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

  requireValid(item: WarmupRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupRequest[]): Map<string, string[]> {
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

export function defaultWarmupRequestValidator(): WarmupRequestValidator {
  return new WarmupRequestValidator(
    [
      new WarmupRequestRequiredUtmSourceRule("warmup request needs this field"),
      new WarmupRequestLabelLengthRule(16),
      new WarmupRequestRevisionRangeRule(64, 1000),
      new WarmupRequestAllowedOwnerIdRule([]),
      new WarmupRequestRequiredOwnerIdRule("warmup request needs this field"),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { RegionalQueueRequest } from "./regional-queue-request.js";

/** A rule a regional queue request must pass. Check returns its problems, or none. */
export interface RegionalQueueRequestRule {
  check(item: RegionalQueueRequest): string[];
}

export class RegionalQueueRequestAllowedLabelRule implements RegionalQueueRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalQueueRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class RegionalQueueRequestCodePrefixRule implements RegionalQueueRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalQueueRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalQueueRequestRequiredLabelRule implements RegionalQueueRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalQueueRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalQueueRequestAttemptsRangeRule implements RegionalQueueRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalQueueRequest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional queue request. */
export class RegionalQueueRequestValidator {
  rules: RegionalQueueRequestRule[];

  constructor(rules: RegionalQueueRequestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalQueueRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalQueueRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalQueueRequest[]): Map<string, string[]> {
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

export function defaultRegionalQueueRequestValidator(): RegionalQueueRequestValidator {
  return new RegionalQueueRequestValidator(
    [
      new RegionalQueueRequestAllowedLabelRule([]),
      new RegionalQueueRequestCodePrefixRule("OPS"),
      new RegionalQueueRequestRequiredLabelRule("regional queue request needs an entry"),
      new RegionalQueueRequestAttemptsRangeRule(255, 1000),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { ScheduledFunnelRequest } from "./scheduled-funnel-request.js";

/** A rule a scheduled funnel request must pass. Check returns its problems, or none. */
export interface ScheduledFunnelRequestRule {
  check(item: ScheduledFunnelRequest): string[];
}

export class ScheduledFunnelRequestAllowedCodeRule implements ScheduledFunnelRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledFunnelRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class ScheduledFunnelRequestNameLengthRule implements ScheduledFunnelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelRequestCeilingRangeRule implements ScheduledFunnelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelRequest): string[] {
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

export class ScheduledFunnelRequestRequiredNameRule implements ScheduledFunnelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled funnel request. */
export class ScheduledFunnelRequestValidator {
  rules: ScheduledFunnelRequestRule[];

  constructor(rules: ScheduledFunnelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelRequest): string[] {
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

  requireValid(item: ScheduledFunnelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelRequest[]): Map<string, string[]> {
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

export function defaultScheduledFunnelRequestValidator(): ScheduledFunnelRequestValidator {
  return new ScheduledFunnelRequestValidator(
    [
      new ScheduledFunnelRequestAllowedCodeRule(["batched"]),
      new ScheduledFunnelRequestNameLengthRule(3600),
      new ScheduledFunnelRequestCeilingRangeRule(4.2, 4823.2),
      new ScheduledFunnelRequestRequiredNameRule("scheduled funnel request needs a value"),
    ],
  );
}

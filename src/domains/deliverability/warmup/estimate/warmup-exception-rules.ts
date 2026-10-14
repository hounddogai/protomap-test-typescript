import * as text from "../../../../kit/text.js";
import { WarmupException } from "./warmup-exception.js";

/** A rule a warmup exception must pass. Check returns its problems, or none. */
export interface WarmupExceptionRule {
  check(item: WarmupException): string[];
}

export class WarmupExceptionRequiredCodeRule implements WarmupExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupExceptionAllowedAudienceIdRule implements WarmupExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is out of range`];
    return [];
  }
}

export class WarmupExceptionPriorityRangeRule implements WarmupExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupException): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupExceptionCodeLengthRule implements WarmupExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup exception. */
export class WarmupExceptionValidator {
  rules: WarmupExceptionRule[];

  constructor(rules: WarmupExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupException[]): Map<string, string[]> {
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

export function defaultWarmupExceptionValidator(): WarmupExceptionValidator {
  return new WarmupExceptionValidator(
    [
      new WarmupExceptionRequiredCodeRule("warmup exception needs this field"),
      new WarmupExceptionAllowedAudienceIdRule(["seasonal", "batched", "seasonal"]),
      new WarmupExceptionPriorityRangeRule(3600, 86400),
      new WarmupExceptionCodeLengthRule(86400),
    ],
  );
}

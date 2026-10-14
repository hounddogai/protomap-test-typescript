import * as text from "../../../../kit/text.js";
import { SenderPolicy } from "./sender-policy.js";

/** A rule a sender policy must pass. Check returns its problems, or none. */
export interface SenderPolicyRule {
  check(item: SenderPolicy): string[];
}

export class SenderPolicyRequiredCodeRule implements SenderPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderPolicyRequiredSegmentRule implements SenderPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderPolicy): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SenderPolicySegmentLengthRule implements SenderPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderPolicy): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderPolicyAllowedLabelRule implements SenderPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class SenderPolicyRevisionRangeRule implements SenderPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderPolicy): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sender policy. */
export class SenderPolicyValidator {
  rules: SenderPolicyRule[];

  constructor(rules: SenderPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SenderPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderPolicy[]): Map<string, string[]> {
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

export function defaultSenderPolicyValidator(): SenderPolicyValidator {
  return new SenderPolicyValidator(
    [
      new SenderPolicyRequiredCodeRule("sender policy needs an entry"),
      new SenderPolicyRequiredSegmentRule("sender policy needs a value"),
      new SenderPolicySegmentLengthRule(80),
      new SenderPolicyAllowedLabelRule(["lenient", "strict"]),
      new SenderPolicyRevisionRangeRule(32, 3600),
    ],
  );
}

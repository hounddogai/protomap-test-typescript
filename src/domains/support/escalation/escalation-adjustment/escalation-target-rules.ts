import * as text from "../../../../kit/text.js";
import { EscalationTarget } from "./escalation-target.js";

/** A rule a escalation target must pass. Check returns its problems, or none. */
export interface EscalationTargetRule {
  check(item: EscalationTarget): string[];
}

export class EscalationTargetAllowedCodeRule implements EscalationTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class EscalationTargetRequiredRegionRule implements EscalationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationTarget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationTargetRegionLengthRule implements EscalationTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationTarget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationTargetCodeLengthRule implements EscalationTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationTargetRevisionRangeRule implements EscalationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationTarget): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationTargetRequiredLabelRule implements EscalationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationTarget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation target. */
export class EscalationTargetValidator {
  rules: EscalationTargetRule[];

  constructor(rules: EscalationTargetRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationTarget): string[] {
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

  requireValid(item: EscalationTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationTarget[]): Map<string, string[]> {
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

export function defaultEscalationTargetValidator(): EscalationTargetValidator {
  return new EscalationTargetValidator(
    [
      new EscalationTargetAllowedCodeRule(["strict", "weighted", "regional"]),
      new EscalationTargetRequiredRegionRule("escalation target needs a value"),
      new EscalationTargetRegionLengthRule(255),
      new EscalationTargetCodeLengthRule(16),
      new EscalationTargetRevisionRangeRule(64, 80),
      new EscalationTargetRequiredLabelRule("escalation target needs an entry"),
    ],
  );
}

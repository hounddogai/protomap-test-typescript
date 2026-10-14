import * as text from "../../../../kit/text.js";
import { JourneyThreshold } from "./journey-threshold.js";

/** A rule a journey threshold must pass. Check returns its problems, or none. */
export interface JourneyThresholdRule {
  check(item: JourneyThreshold): string[];
}

export class JourneyThresholdAllowedNameRule implements JourneyThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class JourneyThresholdRequiredTimezoneRule implements JourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyThreshold): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyThresholdRequiredLabelRule implements JourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyThresholdRequiredCodeRule implements JourneyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyThresholdLabelLengthRule implements JourneyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey threshold. */
export class JourneyThresholdValidator {
  rules: JourneyThresholdRule[];

  constructor(rules: JourneyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyThreshold[]): Map<string, string[]> {
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

export function defaultJourneyThresholdValidator(): JourneyThresholdValidator {
  return new JourneyThresholdValidator(
    [
      new JourneyThresholdAllowedNameRule(["pending", "global"]),
      new JourneyThresholdRequiredTimezoneRule("journey threshold needs an entry"),
      new JourneyThresholdRequiredLabelRule("journey threshold needs this field"),
      new JourneyThresholdRequiredCodeRule("journey threshold needs a value"),
      new JourneyThresholdLabelLengthRule(3600),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { JourneyEstimate } from "./journey-estimate.js";

/** A rule a journey estimate must pass. Check returns its problems, or none. */
export interface JourneyEstimateRule {
  check(item: JourneyEstimate): string[];
}

export class JourneyEstimateAllowedLabelRule implements JourneyEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class JourneyEstimateRequiredCodeRule implements JourneyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyEstimateLabelLengthRule implements JourneyEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyEstimateRequiredUtmSourceRule implements JourneyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyEstimate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyEstimateRequiredOwnerIdRule implements JourneyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyEstimate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey estimate. */
export class JourneyEstimateValidator {
  rules: JourneyEstimateRule[];

  constructor(rules: JourneyEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyEstimate): string[] {
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

  requireValid(item: JourneyEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyEstimate[]): Map<string, string[]> {
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

export function defaultJourneyEstimateValidator(): JourneyEstimateValidator {
  return new JourneyEstimateValidator(
    [
      new JourneyEstimateAllowedLabelRule([]),
      new JourneyEstimateRequiredCodeRule("journey estimate needs this field"),
      new JourneyEstimateLabelLengthRule(86400),
      new JourneyEstimateRequiredUtmSourceRule("journey estimate needs this field"),
      new JourneyEstimateRequiredOwnerIdRule("journey estimate needs a value"),
    ],
  );
}

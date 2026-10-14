import * as text from "../../../../kit/text.js";
import { LenientFlightPlan } from "./lenient-flight-plan.js";

/** A rule a lenient flight plan must pass. Check returns its problems, or none. */
export interface LenientFlightPlanRule {
  check(item: LenientFlightPlan): string[];
}

export class LenientFlightPlanBatchSizeRangeRule implements LenientFlightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFlightPlan): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientFlightPlanRequiredPhoneRule implements LenientFlightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientFlightPlan): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientFlightPlanAllowedPhoneRule implements LenientFlightPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientFlightPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is inconsistent`];
    return [];
  }
}

export class LenientFlightPlanCodeLengthRule implements LenientFlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFlightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientFlightPlanPhoneLengthRule implements LenientFlightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientFlightPlan): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient flight plan. */
export class LenientFlightPlanValidator {
  rules: LenientFlightPlanRule[];

  constructor(rules: LenientFlightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFlightPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientFlightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFlightPlan[]): Map<string, string[]> {
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

export function defaultLenientFlightPlanValidator(): LenientFlightPlanValidator {
  return new LenientFlightPlanValidator(
    [
      new LenientFlightPlanBatchSizeRangeRule(64, 86400),
      new LenientFlightPlanRequiredPhoneRule("lenient flight plan needs an entry"),
      new LenientFlightPlanAllowedPhoneRule(["adaptive"]),
      new LenientFlightPlanCodeLengthRule(80),
      new LenientFlightPlanPhoneLengthRule(32),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { StepException } from "./step-exception.js";

/** A rule a step exception must pass. Check returns its problems, or none. */
export interface StepExceptionRule {
  check(item: StepException): string[];
}

export class StepExceptionNameLengthRule implements StepExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepException): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepExceptionAllowedLocaleRule implements StepExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is stale`];
    return [];
  }
}

export class StepExceptionRequiredLabelRule implements StepExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StepExceptionRequiredCodeRule implements StepExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step exception. */
export class StepExceptionValidator {
  rules: StepExceptionRule[];

  constructor(rules: StepExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: StepException): string[] {
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

  requireValid(item: StepException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepException[]): Map<string, string[]> {
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

export function defaultStepExceptionValidator(): StepExceptionValidator {
  return new StepExceptionValidator(
    [
      new StepExceptionNameLengthRule(255),
      new StepExceptionAllowedLocaleRule([]),
      new StepExceptionRequiredLabelRule("step exception needs this field"),
      new StepExceptionRequiredCodeRule("step exception needs an entry"),
    ],
  );
}

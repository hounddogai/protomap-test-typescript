import * as text from "../../../../kit/text.js";
import { StepOverride } from "./step-override.js";

/** A rule a step override must pass. Check returns its problems, or none. */
export interface StepOverrideRule {
  check(item: StepOverride): string[];
}

export class StepOverrideAllowedDescriptionRule implements StepOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is above maximum`];
    return [];
  }
}

export class StepOverrideDurationMinutesRangeRule implements StepOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepOverride): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepOverrideRequiredCodeRule implements StepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepOverrideCodePrefixRule implements StepOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepOverrideRequiredNameRule implements StepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StepOverrideRequiredReviewerRule implements StepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepOverride): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step override. */
export class StepOverrideValidator {
  rules: StepOverrideRule[];

  constructor(rules: StepOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StepOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepOverride[]): Map<string, string[]> {
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

export function defaultStepOverrideValidator(): StepOverrideValidator {
  return new StepOverrideValidator(
    [
      new StepOverrideAllowedDescriptionRule(["tiered"]),
      new StepOverrideDurationMinutesRangeRule(16, 64),
      new StepOverrideRequiredCodeRule("step override needs an entry"),
      new StepOverrideCodePrefixRule("OPS"),
      new StepOverrideRequiredNameRule("step override needs this field"),
      new StepOverrideRequiredReviewerRule("step override needs a value"),
    ],
  );
}

import * as text from "../../../../kit/text.js";
import { StepAllocation } from "./step-allocation.js";

/** A rule a step allocation must pass. Check returns its problems, or none. */
export interface StepAllocationRule {
  check(item: StepAllocation): string[];
}

export class StepAllocationAllowedCodeRule implements StepAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class StepAllocationRequiredLabelRule implements StepAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StepAllocationRequiredLocaleRule implements StepAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAllocation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StepAllocationCodeLengthRule implements StepAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAllocationCodePrefixRule implements StepAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a step allocation. */
export class StepAllocationValidator {
  rules: StepAllocationRule[];

  constructor(rules: StepAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: StepAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepAllocation[]): Map<string, string[]> {
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

export function defaultStepAllocationValidator(): StepAllocationValidator {
  return new StepAllocationValidator(
    [
      new StepAllocationAllowedCodeRule(["global", "primary"]),
      new StepAllocationRequiredLabelRule("step allocation needs an entry"),
      new StepAllocationRequiredLocaleRule("step allocation needs this field"),
      new StepAllocationCodeLengthRule(255),
      new StepAllocationCodePrefixRule("X"),
    ],
  );
}

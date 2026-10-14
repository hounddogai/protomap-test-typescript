import * as text from "../../../../kit/text.js";
import { ManualActivationWindow } from "./manual-activation-window.js";

/** A rule a manual activation window must pass. Check returns its problems, or none. */
export interface ManualActivationWindowRule {
  check(item: ManualActivationWindow): string[];
}

export class ManualActivationWindowRequiredNameRule implements ManualActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualActivationWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualActivationWindowCodePrefixRule implements ManualActivationWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualActivationWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualActivationWindowSequenceRangeRule implements ManualActivationWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualActivationWindow): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualActivationWindowAllowedNameRule implements ManualActivationWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualActivationWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class ManualActivationWindowNameLengthRule implements ManualActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualActivationWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual activation window. */
export class ManualActivationWindowValidator {
  rules: ManualActivationWindowRule[];

  constructor(rules: ManualActivationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ManualActivationWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualActivationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualActivationWindow[]): Map<string, string[]> {
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

export function defaultManualActivationWindowValidator(): ManualActivationWindowValidator {
  return new ManualActivationWindowValidator(
    [
      new ManualActivationWindowRequiredNameRule("manual activation window needs an entry"),
      new ManualActivationWindowCodePrefixRule("Q"),
      new ManualActivationWindowSequenceRangeRule(64, 1000),
      new ManualActivationWindowAllowedNameRule(["lenient", "fallback", "seasonal"]),
      new ManualActivationWindowNameLengthRule(80),
    ],
  );
}

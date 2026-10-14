import * as text from "../../../../kit/text.js";
import { TouchpointWindow } from "./touchpoint-window.js";

/** A rule a touchpoint window must pass. Check returns its problems, or none. */
export interface TouchpointWindowRule {
  check(item: TouchpointWindow): string[];
}

export class TouchpointWindowAllowedNameRule implements TouchpointWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class TouchpointWindowAttemptsRangeRule implements TouchpointWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointWindow): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointWindowNameLengthRule implements TouchpointWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointWindowRequiredLabelRule implements TouchpointWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointWindowRequiredNameRule implements TouchpointWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint window. */
export class TouchpointWindowValidator {
  rules: TouchpointWindowRule[];

  constructor(rules: TouchpointWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointWindow): string[] {
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

  requireValid(item: TouchpointWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointWindow[]): Map<string, string[]> {
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

export function defaultTouchpointWindowValidator(): TouchpointWindowValidator {
  return new TouchpointWindowValidator(
    [
      new TouchpointWindowAllowedNameRule(["strict", "regional", "legacy"]),
      new TouchpointWindowAttemptsRangeRule(16, 255),
      new TouchpointWindowNameLengthRule(3600),
      new TouchpointWindowRequiredLabelRule("touchpoint window needs this field"),
      new TouchpointWindowRequiredNameRule("touchpoint window needs this field"),
    ],
  );
}

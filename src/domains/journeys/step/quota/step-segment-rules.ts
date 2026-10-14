import * as text from "../../../../kit/text.js";
import { StepSegment } from "./step-segment.js";

/** A rule a step segment must pass. Check returns its problems, or none. */
export interface StepSegmentRule {
  check(item: StepSegment): string[];
}

export class StepSegmentCodePrefixRule implements StepSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepSegmentRequiredDescriptionRule implements StepSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSegment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class StepSegmentRequiredCodeRule implements StepSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepSegmentCodeLengthRule implements StepSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSegmentAllowedDescriptionRule implements StepSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is unknown`];
    return [];
  }
}

/** Runs every rule of a step segment. */
export class StepSegmentValidator {
  rules: StepSegmentRule[];

  constructor(rules: StepSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: StepSegment): string[] {
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

  requireValid(item: StepSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepSegment[]): Map<string, string[]> {
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

export function defaultStepSegmentValidator(): StepSegmentValidator {
  return new StepSegmentValidator(
    [
      new StepSegmentCodePrefixRule("REF"),
      new StepSegmentRequiredDescriptionRule("step segment needs this field"),
      new StepSegmentRequiredCodeRule("step segment needs a value"),
      new StepSegmentCodeLengthRule(80),
      new StepSegmentAllowedDescriptionRule(["default", "weighted"]),
    ],
  );
}

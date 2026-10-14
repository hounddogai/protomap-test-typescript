import * as text from "../../../../kit/text.js";
import { SlaPlan } from "./sla-plan.js";

/** A rule a sla plan must pass. Check returns its problems, or none. */
export interface SlaPlanRule {
  check(item: SlaPlan): string[];
}

export class SlaPlanRequiredCodeRule implements SlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaPlanTimezoneLengthRule implements SlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaPlan): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaPlanAllowedTitleRule implements SlaPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class SlaPlanCodePrefixRule implements SlaPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaPlanCodeLengthRule implements SlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaPlanSequenceRangeRule implements SlaPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaPlan): string[] {
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

/** Runs every rule of a sla plan. */
export class SlaPlanValidator {
  rules: SlaPlanRule[];

  constructor(rules: SlaPlanRule[]) {
    this.rules = rules;
  }

  validate(item: SlaPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaPlan[]): Map<string, string[]> {
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

export function defaultSlaPlanValidator(): SlaPlanValidator {
  return new SlaPlanValidator(
    [
      new SlaPlanRequiredCodeRule("sla plan needs a value"),
      new SlaPlanTimezoneLengthRule(1000),
      new SlaPlanAllowedTitleRule(["batched", "regional"]),
      new SlaPlanCodePrefixRule("ACM"),
      new SlaPlanCodeLengthRule(80),
      new SlaPlanSequenceRangeRule(16, 255),
    ],
  );
}

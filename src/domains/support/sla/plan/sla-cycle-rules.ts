import * as text from "../../../../kit/text.js";
import { SlaCycle } from "./sla-cycle.js";

/** A rule a sla cycle must pass. Check returns its problems, or none. */
export interface SlaCycleRule {
  check(item: SlaCycle): string[];
}

export class SlaCycleAllowedLabelRule implements SlaCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class SlaCycleCodePrefixRule implements SlaCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaCycleRequiredCodeRule implements SlaCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaCycleDescriptionLengthRule implements SlaCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaCycle): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaCycleCodeLengthRule implements SlaCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla cycle. */
export class SlaCycleValidator {
  rules: SlaCycleRule[];

  constructor(rules: SlaCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SlaCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaCycle[]): Map<string, string[]> {
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

export function defaultSlaCycleValidator(): SlaCycleValidator {
  return new SlaCycleValidator(
    [
      new SlaCycleAllowedLabelRule(["batched"]),
      new SlaCycleCodePrefixRule("X"),
      new SlaCycleRequiredCodeRule("sla cycle needs a value"),
      new SlaCycleDescriptionLengthRule(120),
      new SlaCycleCodeLengthRule(86400),
    ],
  );
}

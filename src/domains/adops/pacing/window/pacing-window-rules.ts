import { PacingWindow } from "./pacing-window.js";

/** A rule a pacing window must pass. Check returns its problems, or none. */
export interface PacingWindowRule {
  check(item: PacingWindow): string[];
}

export class PacingWindowNameLengthRule implements PacingWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingWindowRequiredNameRule implements PacingWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PacingWindowCodePrefixRule implements PacingWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingWindowRequiredTitleRule implements PacingWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PacingWindowCodeLengthRule implements PacingWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing window. */
export class PacingWindowValidator {
  rules: PacingWindowRule[];

  constructor(rules: PacingWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PacingWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingWindow[]): Map<string, string[]> {
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

export function defaultPacingWindowValidator(): PacingWindowValidator {
  return new PacingWindowValidator(
    [
      new PacingWindowNameLengthRule(120),
      new PacingWindowRequiredNameRule("pacing window needs this field"),
      new PacingWindowCodePrefixRule("Q"),
      new PacingWindowRequiredTitleRule("pacing window needs a value"),
      new PacingWindowCodeLengthRule(3600),
    ],
  );
}

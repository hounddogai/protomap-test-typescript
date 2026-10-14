import { CsatWindow } from "./csat-window.js";

/** A rule a csat window must pass. Check returns its problems, or none. */
export interface CsatWindowRule {
  check(item: CsatWindow): string[];
}

export class CsatWindowNameLengthRule implements CsatWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatWindowCodePrefixRule implements CsatWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatWindowRequiredCodeRule implements CsatWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CsatWindowSendAtRangeRule implements CsatWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatWindow): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a csat window. */
export class CsatWindowValidator {
  rules: CsatWindowRule[];

  constructor(rules: CsatWindowRule[]) {
    this.rules = rules;
  }

  validate(item: CsatWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatWindow[]): Map<string, string[]> {
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

export function defaultCsatWindowValidator(): CsatWindowValidator {
  return new CsatWindowValidator(
    [
      new CsatWindowNameLengthRule(255),
      new CsatWindowCodePrefixRule("ACM"),
      new CsatWindowRequiredCodeRule("csat window needs an entry"),
      new CsatWindowSendAtRangeRule(80, 3600),
    ],
  );
}

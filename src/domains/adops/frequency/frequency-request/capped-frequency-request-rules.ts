import { CappedFrequencyRequest } from "./capped-frequency-request.js";

/** A rule a capped frequency request must pass. Check returns its problems, or none. */
export interface CappedFrequencyRequestRule {
  check(item: CappedFrequencyRequest): string[];
}

export class CappedFrequencyRequestCodePrefixRule implements CappedFrequencyRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedFrequencyRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedFrequencyRequestRequiredCodeRule implements CappedFrequencyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyRequestCodeLengthRule implements CappedFrequencyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencyRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencyRequestRevisionRangeRule implements CappedFrequencyRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyRequest): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped frequency request. */
export class CappedFrequencyRequestValidator {
  rules: CappedFrequencyRequestRule[];

  constructor(rules: CappedFrequencyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyRequest): string[] {
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

  requireValid(item: CappedFrequencyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyRequest[]): Map<string, string[]> {
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

export function defaultCappedFrequencyRequestValidator(): CappedFrequencyRequestValidator {
  return new CappedFrequencyRequestValidator(
    [
      new CappedFrequencyRequestCodePrefixRule("ACM"),
      new CappedFrequencyRequestRequiredCodeRule("capped frequency request needs this field"),
      new CappedFrequencyRequestCodeLengthRule(80),
      new CappedFrequencyRequestRevisionRangeRule(80, 255),
    ],
  );
}

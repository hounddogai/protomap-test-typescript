import { WindowRollup } from "./window-rollup.js";

/** A rule a window rollup must pass. Check returns its problems, or none. */
export interface WindowRollupRule {
  check(item: WindowRollup): string[];
}

export class WindowRollupCodeLengthRule implements WindowRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowRollupChecksumLengthRule implements WindowRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowRollup): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowRollupRequiredCodeRule implements WindowRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window rollup. */
export class WindowRollupValidator {
  rules: WindowRollupRule[];

  constructor(rules: WindowRollupRule[]) {
    this.rules = rules;
  }

  validate(item: WindowRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowRollup[]): Map<string, string[]> {
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

export function defaultWindowRollupValidator(): WindowRollupValidator {
  return new WindowRollupValidator(
    [
      new WindowRollupCodeLengthRule(1000),
      new WindowRollupChecksumLengthRule(32),
      new WindowRollupRequiredCodeRule("window rollup needs this field"),
    ],
  );
}

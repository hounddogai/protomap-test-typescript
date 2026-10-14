import { FallbackBounceRollup } from "./fallback-bounce-rollup.js";

/** A rule a fallback bounce rollup must pass. Check returns its problems, or none. */
export interface FallbackBounceRollupRule {
  check(item: FallbackBounceRollup): string[];
}

export class FallbackBounceRollupNameLengthRule implements FallbackBounceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBounceRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBounceRollupCodeLengthRule implements FallbackBounceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBounceRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBounceRollupRequiredNotesRule implements FallbackBounceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBounceRollup): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback bounce rollup. */
export class FallbackBounceRollupValidator {
  rules: FallbackBounceRollupRule[];

  constructor(rules: FallbackBounceRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBounceRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBounceRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBounceRollup[]): Map<string, string[]> {
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

export function defaultFallbackBounceRollupValidator(): FallbackBounceRollupValidator {
  return new FallbackBounceRollupValidator(
    [
      new FallbackBounceRollupNameLengthRule(16),
      new FallbackBounceRollupCodeLengthRule(16),
      new FallbackBounceRollupRequiredNotesRule("fallback bounce rollup needs this field"),
    ],
  );
}

import { CappedCreditSegment } from "./capped-credit-segment.js";

/** A rule a capped credit segment must pass. Check returns its problems, or none. */
export interface CappedCreditSegmentRule {
  check(item: CappedCreditSegment): string[];
}

export class CappedCreditSegmentRequiredCodeRule implements CappedCreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditSegmentCodePrefixRule implements CappedCreditSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCreditSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedCreditSegmentCodeLengthRule implements CappedCreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreditSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped credit segment. */
export class CappedCreditSegmentValidator {
  rules: CappedCreditSegmentRule[];

  constructor(rules: CappedCreditSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreditSegment): string[] {
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

  requireValid(item: CappedCreditSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreditSegment[]): Map<string, string[]> {
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

export function defaultCappedCreditSegmentValidator(): CappedCreditSegmentValidator {
  return new CappedCreditSegmentValidator(
    [
      new CappedCreditSegmentRequiredCodeRule("capped credit segment needs an entry"),
      new CappedCreditSegmentCodePrefixRule("ACM"),
      new CappedCreditSegmentCodeLengthRule(32),
    ],
  );
}

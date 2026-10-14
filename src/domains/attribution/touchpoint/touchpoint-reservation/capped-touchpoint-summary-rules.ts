import { CappedTouchpointSummary } from "./capped-touchpoint-summary.js";

/** A rule a capped touchpoint summary must pass. Check returns its problems, or none. */
export interface CappedTouchpointSummaryRule {
  check(item: CappedTouchpointSummary): string[];
}

export class CappedTouchpointSummaryScoreRangeRule implements CappedTouchpointSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedTouchpointSummary): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedTouchpointSummaryRequiredTitleRule implements CappedTouchpointSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTouchpointSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTouchpointSummaryCodePrefixRule implements CappedTouchpointSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedTouchpointSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedTouchpointSummaryCodeLengthRule implements CappedTouchpointSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTouchpointSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped touchpoint summary. */
export class CappedTouchpointSummaryValidator {
  rules: CappedTouchpointSummaryRule[];

  constructor(rules: CappedTouchpointSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTouchpointSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedTouchpointSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTouchpointSummary[]): Map<string, string[]> {
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

export function defaultCappedTouchpointSummaryValidator(): CappedTouchpointSummaryValidator {
  return new CappedTouchpointSummaryValidator(
    [
      new CappedTouchpointSummaryScoreRangeRule(4, 3816.6),
      new CappedTouchpointSummaryRequiredTitleRule("capped touchpoint summary needs a value"),
      new CappedTouchpointSummaryCodePrefixRule("OPS"),
      new CappedTouchpointSummaryCodeLengthRule(80),
    ],
  );
}

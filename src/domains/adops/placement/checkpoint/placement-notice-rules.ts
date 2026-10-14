import { PlacementNotice } from "./placement-notice.js";

/** A rule a placement notice must pass. Check returns its problems, or none. */
export interface PlacementNoticeRule {
  check(item: PlacementNotice): string[];
}

export class PlacementNoticeCodePrefixRule implements PlacementNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementNoticeRequiredCodeRule implements PlacementNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementNoticeBudgetRangeRule implements PlacementNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementNotice): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementNoticeRequiredNameRule implements PlacementNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementNoticeCodeLengthRule implements PlacementNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement notice. */
export class PlacementNoticeValidator {
  rules: PlacementNoticeRule[];

  constructor(rules: PlacementNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementNotice): string[] {
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

  requireValid(item: PlacementNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementNotice[]): Map<string, string[]> {
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

export function defaultPlacementNoticeValidator(): PlacementNoticeValidator {
  return new PlacementNoticeValidator(
    [
      new PlacementNoticeCodePrefixRule("X"),
      new PlacementNoticeRequiredCodeRule("placement notice needs an entry"),
      new PlacementNoticeBudgetRangeRule(8, 3478.2),
      new PlacementNoticeRequiredNameRule("placement notice needs a value"),
      new PlacementNoticeCodeLengthRule(1000),
    ],
  );
}

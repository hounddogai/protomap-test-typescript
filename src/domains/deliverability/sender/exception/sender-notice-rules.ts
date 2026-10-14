import { SenderNotice } from "./sender-notice.js";

/** A rule a sender notice must pass. Check returns its problems, or none. */
export interface SenderNoticeRule {
  check(item: SenderNotice): string[];
}

export class SenderNoticeCreatedAtRangeRule implements SenderNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderNotice): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderNoticeRequiredCodeRule implements SenderNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderNoticeCodePrefixRule implements SenderNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderNoticeCapacityRangeRule implements SenderNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderNotice): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderNoticeRequiredTitleRule implements SenderNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender notice. */
export class SenderNoticeValidator {
  rules: SenderNoticeRule[];

  constructor(rules: SenderNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: SenderNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderNotice[]): Map<string, string[]> {
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

export function defaultSenderNoticeValidator(): SenderNoticeValidator {
  return new SenderNoticeValidator(
    [
      new SenderNoticeCreatedAtRangeRule(16, 80),
      new SenderNoticeRequiredCodeRule("sender notice needs a value"),
      new SenderNoticeCodePrefixRule("Q"),
      new SenderNoticeCapacityRangeRule(255, 1000),
      new SenderNoticeRequiredTitleRule("sender notice needs an entry"),
    ],
  );
}

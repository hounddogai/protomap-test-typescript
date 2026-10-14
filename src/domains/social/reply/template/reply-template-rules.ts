import { ReplyTemplate } from "./reply-template.js";

/** A rule a reply template must pass. Check returns its problems, or none. */
export interface ReplyTemplateRule {
  check(item: ReplyTemplate): string[];
}

export class ReplyTemplateRequiredSourceRule implements ReplyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyTemplate): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyTemplateCurrencyLengthRule implements ReplyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyTemplate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyTemplateScoreRangeRule implements ReplyTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyTemplate): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyTemplateSourceLengthRule implements ReplyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyTemplate): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply template. */
export class ReplyTemplateValidator {
  rules: ReplyTemplateRule[];

  constructor(rules: ReplyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyTemplate): string[] {
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

  requireValid(item: ReplyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyTemplate[]): Map<string, string[]> {
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

export function defaultReplyTemplateValidator(): ReplyTemplateValidator {
  return new ReplyTemplateValidator(
    [
      new ReplyTemplateRequiredSourceRule("reply template needs a value"),
      new ReplyTemplateCurrencyLengthRule(3600),
      new ReplyTemplateScoreRangeRule(7.9, 3103.6),
      new ReplyTemplateSourceLengthRule(64),
    ],
  );
}

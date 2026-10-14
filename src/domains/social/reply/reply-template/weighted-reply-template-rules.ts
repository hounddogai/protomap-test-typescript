import { WeightedReplyTemplate } from "./weighted-reply-template.js";

/** A rule a weighted reply template must pass. Check returns its problems, or none. */
export interface WeightedReplyTemplateRule {
  check(item: WeightedReplyTemplate): string[];
}

export class WeightedReplyTemplateActiveGuardRule implements WeightedReplyTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedReplyTemplate): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WeightedReplyTemplateRequiredCodeRule implements WeightedReplyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReplyTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReplyTemplateCodeLengthRule implements WeightedReplyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplyTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplyTemplateCodePrefixRule implements WeightedReplyTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedReplyTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedReplyTemplateNameLengthRule implements WeightedReplyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplyTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplyTemplateRequiredNameRule implements WeightedReplyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReplyTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted reply template. */
export class WeightedReplyTemplateValidator {
  rules: WeightedReplyTemplateRule[];

  constructor(rules: WeightedReplyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReplyTemplate): string[] {
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

  requireValid(item: WeightedReplyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReplyTemplate[]): Map<string, string[]> {
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

export function defaultWeightedReplyTemplateValidator(): WeightedReplyTemplateValidator {
  return new WeightedReplyTemplateValidator(
    [
      new WeightedReplyTemplateActiveGuardRule(3.3),
      new WeightedReplyTemplateRequiredCodeRule("weighted reply template needs an entry"),
      new WeightedReplyTemplateCodeLengthRule(86400),
      new WeightedReplyTemplateCodePrefixRule("X"),
      new WeightedReplyTemplateNameLengthRule(80),
      new WeightedReplyTemplateRequiredNameRule("weighted reply template needs this field"),
    ],
  );
}

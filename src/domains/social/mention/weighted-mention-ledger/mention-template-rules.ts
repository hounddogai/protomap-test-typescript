import { MentionTemplate } from "./mention-template.js";

/** A rule a mention template must pass. Check returns its problems, or none. */
export interface MentionTemplateRule {
  check(item: MentionTemplate): string[];
}

export class MentionTemplateExpiresAtRangeRule implements MentionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionTemplate): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionTemplateRequiredNameRule implements MentionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MentionTemplateNameLengthRule implements MentionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention template. */
export class MentionTemplateValidator {
  rules: MentionTemplateRule[];

  constructor(rules: MentionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: MentionTemplate): string[] {
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

  requireValid(item: MentionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionTemplate[]): Map<string, string[]> {
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

export function defaultMentionTemplateValidator(): MentionTemplateValidator {
  return new MentionTemplateValidator(
    [
      new MentionTemplateExpiresAtRangeRule(80, 255),
      new MentionTemplateRequiredNameRule("mention template needs a value"),
      new MentionTemplateNameLengthRule(120),
    ],
  );
}

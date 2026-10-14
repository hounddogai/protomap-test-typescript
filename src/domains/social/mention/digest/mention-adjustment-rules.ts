import { MentionAdjustment } from "./mention-adjustment.js";

/** A rule a mention adjustment must pass. Check returns its problems, or none. */
export interface MentionAdjustmentRule {
  check(item: MentionAdjustment): string[];
}

export class MentionAdjustmentCodePrefixRule implements MentionAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionAdjustmentUtmSourceLengthRule implements MentionAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAdjustment): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAdjustmentRequiredUtmSourceRule implements MentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionAdjustment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention adjustment. */
export class MentionAdjustmentValidator {
  rules: MentionAdjustmentRule[];

  constructor(rules: MentionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: MentionAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionAdjustment[]): Map<string, string[]> {
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

export function defaultMentionAdjustmentValidator(): MentionAdjustmentValidator {
  return new MentionAdjustmentValidator(
    [
      new MentionAdjustmentCodePrefixRule("X"),
      new MentionAdjustmentUtmSourceLengthRule(1000),
      new MentionAdjustmentRequiredUtmSourceRule("mention adjustment needs this field"),
    ],
  );
}

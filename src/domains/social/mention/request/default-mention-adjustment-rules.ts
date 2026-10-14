import { DefaultMentionAdjustment } from "./default-mention-adjustment.js";

/** A rule a default mention adjustment must pass. Check returns its problems, or none. */
export interface DefaultMentionAdjustmentRule {
  check(item: DefaultMentionAdjustment): string[];
}

export class DefaultMentionAdjustmentRequiredChecksumRule implements DefaultMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionAdjustment): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionAdjustmentRequiredCodeRule implements DefaultMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionAdjustmentRequiredTitleRule implements DefaultMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMentionAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMentionAdjustmentPriorityRangeRule implements DefaultMentionAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultMentionAdjustment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default mention adjustment. */
export class DefaultMentionAdjustmentValidator {
  rules: DefaultMentionAdjustmentRule[];

  constructor(rules: DefaultMentionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMentionAdjustment): string[] {
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

  requireValid(item: DefaultMentionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMentionAdjustment[]): Map<string, string[]> {
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

export function defaultDefaultMentionAdjustmentValidator(): DefaultMentionAdjustmentValidator {
  return new DefaultMentionAdjustmentValidator(
    [
      new DefaultMentionAdjustmentRequiredChecksumRule("default mention adjustment needs this field"),
      new DefaultMentionAdjustmentRequiredCodeRule("default mention adjustment needs this field"),
      new DefaultMentionAdjustmentRequiredTitleRule("default mention adjustment needs a value"),
      new DefaultMentionAdjustmentPriorityRangeRule(120, 86400),
    ],
  );
}

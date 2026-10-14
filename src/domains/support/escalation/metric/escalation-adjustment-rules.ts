import { EscalationAdjustment } from "./escalation-adjustment.js";

/** A rule a escalation adjustment must pass. Check returns its problems, or none. */
export interface EscalationAdjustmentRule {
  check(item: EscalationAdjustment): string[];
}

export class EscalationAdjustmentRevisionRangeRule implements EscalationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationAdjustment): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationAdjustmentRequiredNameRule implements EscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAdjustmentRequiredChannelRule implements EscalationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAdjustment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAdjustmentContactEmailLengthRule implements EscalationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationAdjustment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation adjustment. */
export class EscalationAdjustmentValidator {
  rules: EscalationAdjustmentRule[];

  constructor(rules: EscalationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationAdjustment): string[] {
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

  requireValid(item: EscalationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationAdjustment[]): Map<string, string[]> {
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

export function defaultEscalationAdjustmentValidator(): EscalationAdjustmentValidator {
  return new EscalationAdjustmentValidator(
    [
      new EscalationAdjustmentRevisionRangeRule(64, 80),
      new EscalationAdjustmentRequiredNameRule("escalation adjustment needs a value"),
      new EscalationAdjustmentRequiredChannelRule("escalation adjustment needs this field"),
      new EscalationAdjustmentContactEmailLengthRule(80),
    ],
  );
}

import { LegacyEscalationNotice } from "./legacy-escalation-notice.js";

/** A rule a legacy escalation notice must pass. Check returns its problems, or none. */
export interface LegacyEscalationNoticeRule {
  check(item: LegacyEscalationNotice): string[];
}

export class LegacyEscalationNoticeRequiredExternalRefRule implements LegacyEscalationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationNotice): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationNoticeLabelLengthRule implements LegacyEscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEscalationNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyEscalationNoticeOpenRateRangeRule implements LegacyEscalationNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEscalationNotice): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyEscalationNoticeRequiredSourceRule implements LegacyEscalationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationNotice): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationNoticeVersionRangeRule implements LegacyEscalationNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyEscalationNotice): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyEscalationNoticeCodeLengthRule implements LegacyEscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyEscalationNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy escalation notice. */
export class LegacyEscalationNoticeValidator {
  rules: LegacyEscalationNoticeRule[];

  constructor(rules: LegacyEscalationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEscalationNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyEscalationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEscalationNotice[]): Map<string, string[]> {
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

export function defaultLegacyEscalationNoticeValidator(): LegacyEscalationNoticeValidator {
  return new LegacyEscalationNoticeValidator(
    [
      new LegacyEscalationNoticeRequiredExternalRefRule("legacy escalation notice needs a value"),
      new LegacyEscalationNoticeLabelLengthRule(32),
      new LegacyEscalationNoticeOpenRateRangeRule(1.7, 3220.7),
      new LegacyEscalationNoticeRequiredSourceRule("legacy escalation notice needs an entry"),
      new LegacyEscalationNoticeVersionRangeRule(120, 255),
      new LegacyEscalationNoticeCodeLengthRule(80),
    ],
  );
}

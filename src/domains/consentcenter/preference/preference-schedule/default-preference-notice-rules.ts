import { DefaultPreferenceNotice } from "./default-preference-notice.js";

/** A rule a default preference notice must pass. Check returns its problems, or none. */
export interface DefaultPreferenceNoticeRule {
  check(item: DefaultPreferenceNotice): string[];
}

export class DefaultPreferenceNoticeFrequencyCapRangeRule implements DefaultPreferenceNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPreferenceNotice): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPreferenceNoticeRequiredLabelRule implements DefaultPreferenceNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferenceNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferenceNoticeSegmentLengthRule implements DefaultPreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceNotice): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferenceNoticeCodePrefixRule implements DefaultPreferenceNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPreferenceNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPreferenceNoticeCodeLengthRule implements DefaultPreferenceNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferenceNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default preference notice. */
export class DefaultPreferenceNoticeValidator {
  rules: DefaultPreferenceNoticeRule[];

  constructor(rules: DefaultPreferenceNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferenceNotice): string[] {
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

  requireValid(item: DefaultPreferenceNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferenceNotice[]): Map<string, string[]> {
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

export function defaultDefaultPreferenceNoticeValidator(): DefaultPreferenceNoticeValidator {
  return new DefaultPreferenceNoticeValidator(
    [
      new DefaultPreferenceNoticeFrequencyCapRangeRule(32, 120),
      new DefaultPreferenceNoticeRequiredLabelRule("default preference notice needs this field"),
      new DefaultPreferenceNoticeSegmentLengthRule(120),
      new DefaultPreferenceNoticeCodePrefixRule("X"),
      new DefaultPreferenceNoticeCodeLengthRule(120),
    ],
  );
}

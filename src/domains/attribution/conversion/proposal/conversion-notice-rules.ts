import { ConversionNotice } from "./conversion-notice.js";

/** A rule a conversion notice must pass. Check returns its problems, or none. */
export interface ConversionNoticeRule {
  check(item: ConversionNotice): string[];
}

export class ConversionNoticeCodeLengthRule implements ConversionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionNoticeRetriesRangeRule implements ConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionNotice): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionNoticeSequenceRangeRule implements ConversionNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionNotice): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionNoticeRequiredContactEmailRule implements ConversionNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionNotice): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionNoticeTimezoneLengthRule implements ConversionNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionNotice): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion notice. */
export class ConversionNoticeValidator {
  rules: ConversionNoticeRule[];

  constructor(rules: ConversionNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionNotice[]): Map<string, string[]> {
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

export function defaultConversionNoticeValidator(): ConversionNoticeValidator {
  return new ConversionNoticeValidator(
    [
      new ConversionNoticeCodeLengthRule(32),
      new ConversionNoticeRetriesRangeRule(16, 64),
      new ConversionNoticeSequenceRangeRule(80, 255),
      new ConversionNoticeRequiredContactEmailRule("conversion notice needs an entry"),
      new ConversionNoticeTimezoneLengthRule(3600),
    ],
  );
}

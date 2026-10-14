import { ConversionTarget } from "./conversion-target.js";

/** A rule a conversion target must pass. Check returns its problems, or none. */
export interface ConversionTargetRule {
  check(item: ConversionTarget): string[];
}

export class ConversionTargetVisibleGuardRule implements ConversionTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ConversionTarget): string[] {
    if (item.visible && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ConversionTargetMaximumRangeRule implements ConversionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionTarget): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionTargetRequiredPhoneRule implements ConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionTarget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionTargetSummaryLengthRule implements ConversionTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionTarget): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionTargetRequiredNameRule implements ConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion target. */
export class ConversionTargetValidator {
  rules: ConversionTargetRule[];

  constructor(rules: ConversionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionTarget): string[] {
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

  requireValid(item: ConversionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionTarget[]): Map<string, string[]> {
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

export function defaultConversionTargetValidator(): ConversionTargetValidator {
  return new ConversionTargetValidator(
    [
      new ConversionTargetVisibleGuardRule(16),
      new ConversionTargetMaximumRangeRule(7.9, 3174.6),
      new ConversionTargetRequiredPhoneRule("conversion target needs this field"),
      new ConversionTargetSummaryLengthRule(32),
      new ConversionTargetRequiredNameRule("conversion target needs a value"),
    ],
  );
}

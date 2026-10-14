import { DefaultPacingSummary } from "./default-pacing-summary.js";

/** A rule a default pacing summary must pass. Check returns its problems, or none. */
export interface DefaultPacingSummaryRule {
  check(item: DefaultPacingSummary): string[];
}

export class DefaultPacingSummaryCurrencyLengthRule implements DefaultPacingSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingSummary): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPacingSummaryRateRangeRule implements DefaultPacingSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingSummary): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultPacingSummaryCodePrefixRule implements DefaultPacingSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPacingSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultPacingSummaryRequiredLabelRule implements DefaultPacingSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPacingSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default pacing summary. */
export class DefaultPacingSummaryValidator {
  rules: DefaultPacingSummaryRule[];

  constructor(rules: DefaultPacingSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPacingSummary): string[] {
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

  requireValid(item: DefaultPacingSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPacingSummary[]): Map<string, string[]> {
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

export function defaultDefaultPacingSummaryValidator(): DefaultPacingSummaryValidator {
  return new DefaultPacingSummaryValidator(
    [
      new DefaultPacingSummaryCurrencyLengthRule(120),
      new DefaultPacingSummaryRateRangeRule(7.8, 4319.4),
      new DefaultPacingSummaryCodePrefixRule("OPS"),
      new DefaultPacingSummaryRequiredLabelRule("default pacing summary needs a value"),
    ],
  );
}

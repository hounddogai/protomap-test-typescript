import { ConversionEntry } from "./conversion-entry.js";

/** A rule a conversion entry must pass. Check returns its problems, or none. */
export interface ConversionEntryRule {
  check(item: ConversionEntry): string[];
}

export class ConversionEntryRequiredCodeRule implements ConversionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionEntryCodePrefixRule implements ConversionEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ConversionEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ConversionEntryLimitRangeRule implements ConversionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionEntry): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionEntryCodeLengthRule implements ConversionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionEntryRequiredChannelRule implements ConversionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion entry. */
export class ConversionEntryValidator {
  rules: ConversionEntryRule[];

  constructor(rules: ConversionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionEntry): string[] {
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

  requireValid(item: ConversionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionEntry[]): Map<string, string[]> {
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

export function defaultConversionEntryValidator(): ConversionEntryValidator {
  return new ConversionEntryValidator(
    [
      new ConversionEntryRequiredCodeRule("conversion entry needs a value"),
      new ConversionEntryCodePrefixRule("REF"),
      new ConversionEntryLimitRangeRule(32, 3600),
      new ConversionEntryCodeLengthRule(16),
      new ConversionEntryRequiredChannelRule("conversion entry needs this field"),
    ],
  );
}

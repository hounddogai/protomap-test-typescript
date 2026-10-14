import { PrimaryConversionTarget } from "./primary-conversion-target.js";

/** A rule a primary conversion target must pass. Check returns its problems, or none. */
export interface PrimaryConversionTargetRule {
  check(item: PrimaryConversionTarget): string[];
}

export class PrimaryConversionTargetRequiredAudienceIdRule implements PrimaryConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionTarget): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionTargetFrequencyCapRangeRule implements PrimaryConversionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryConversionTarget): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryConversionTargetRequiredCodeRule implements PrimaryConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionTargetRequiredVariantRule implements PrimaryConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryConversionTarget): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryConversionTargetCodePrefixRule implements PrimaryConversionTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryConversionTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary conversion target. */
export class PrimaryConversionTargetValidator {
  rules: PrimaryConversionTargetRule[];

  constructor(rules: PrimaryConversionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryConversionTarget): string[] {
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

  requireValid(item: PrimaryConversionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryConversionTarget[]): Map<string, string[]> {
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

export function defaultPrimaryConversionTargetValidator(): PrimaryConversionTargetValidator {
  return new PrimaryConversionTargetValidator(
    [
      new PrimaryConversionTargetRequiredAudienceIdRule("primary conversion target needs this field"),
      new PrimaryConversionTargetFrequencyCapRangeRule(32, 3600),
      new PrimaryConversionTargetRequiredCodeRule("primary conversion target needs this field"),
      new PrimaryConversionTargetRequiredVariantRule("primary conversion target needs a value"),
      new PrimaryConversionTargetCodePrefixRule("X"),
    ],
  );
}

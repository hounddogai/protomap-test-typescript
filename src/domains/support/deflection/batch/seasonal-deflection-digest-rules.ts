import { SeasonalDeflectionDigest } from "./seasonal-deflection-digest.js";

/** A rule a seasonal deflection digest must pass. Check returns its problems, or none. */
export interface SeasonalDeflectionDigestRule {
  check(item: SeasonalDeflectionDigest): string[];
}

export class SeasonalDeflectionDigestRequiredCodeRule implements SeasonalDeflectionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDeflectionDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDeflectionDigestCodePrefixRule implements SeasonalDeflectionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalDeflectionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalDeflectionDigestCodeLengthRule implements SeasonalDeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDeflectionDigestLabelLengthRule implements SeasonalDeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDeflectionDigestPhoneLengthRule implements SeasonalDeflectionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDeflectionDigest): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal deflection digest. */
export class SeasonalDeflectionDigestValidator {
  rules: SeasonalDeflectionDigestRule[];

  constructor(rules: SeasonalDeflectionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDeflectionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDeflectionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDeflectionDigest[]): Map<string, string[]> {
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

export function defaultSeasonalDeflectionDigestValidator(): SeasonalDeflectionDigestValidator {
  return new SeasonalDeflectionDigestValidator(
    [
      new SeasonalDeflectionDigestRequiredCodeRule("seasonal deflection digest needs an entry"),
      new SeasonalDeflectionDigestCodePrefixRule("ACM"),
      new SeasonalDeflectionDigestCodeLengthRule(1000),
      new SeasonalDeflectionDigestLabelLengthRule(120),
      new SeasonalDeflectionDigestPhoneLengthRule(120),
    ],
  );
}

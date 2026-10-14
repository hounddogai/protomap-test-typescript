import { SeasonalConversionGroup } from "./seasonal-conversion-group.js";

/** A rule a seasonal conversion group must pass. Check returns its problems, or none. */
export interface SeasonalConversionGroupRule {
  check(item: SeasonalConversionGroup): string[];
}

export class SeasonalConversionGroupRequiredNameRule implements SeasonalConversionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalConversionGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalConversionGroupRequiredReviewerRule implements SeasonalConversionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalConversionGroup): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalConversionGroupNameLengthRule implements SeasonalConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalConversionGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalConversionGroupCodePrefixRule implements SeasonalConversionGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalConversionGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalConversionGroupCodeLengthRule implements SeasonalConversionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalConversionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal conversion group. */
export class SeasonalConversionGroupValidator {
  rules: SeasonalConversionGroupRule[];

  constructor(rules: SeasonalConversionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalConversionGroup): string[] {
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

  requireValid(item: SeasonalConversionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalConversionGroup[]): Map<string, string[]> {
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

export function defaultSeasonalConversionGroupValidator(): SeasonalConversionGroupValidator {
  return new SeasonalConversionGroupValidator(
    [
      new SeasonalConversionGroupRequiredNameRule("seasonal conversion group needs this field"),
      new SeasonalConversionGroupRequiredReviewerRule("seasonal conversion group needs this field"),
      new SeasonalConversionGroupNameLengthRule(3600),
      new SeasonalConversionGroupCodePrefixRule("ACM"),
      new SeasonalConversionGroupCodeLengthRule(86400),
    ],
  );
}

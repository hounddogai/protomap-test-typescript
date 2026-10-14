import { LegacyCreativeOverride } from "./legacy-creative-override.js";

/** A rule a legacy creative override must pass. Check returns its problems, or none. */
export interface LegacyCreativeOverrideRule {
  check(item: LegacyCreativeOverride): string[];
}

export class LegacyCreativeOverrideRequiredCodeRule implements LegacyCreativeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyCreativeOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyCreativeOverrideMaximumRangeRule implements LegacyCreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyCreativeOverride): string[] {
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

export class LegacyCreativeOverrideSourceLengthRule implements LegacyCreativeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeOverride): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeOverrideCodeLengthRule implements LegacyCreativeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyCreativeOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyCreativeOverrideCodePrefixRule implements LegacyCreativeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyCreativeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy creative override. */
export class LegacyCreativeOverrideValidator {
  rules: LegacyCreativeOverrideRule[];

  constructor(rules: LegacyCreativeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyCreativeOverride): string[] {
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

  requireValid(item: LegacyCreativeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyCreativeOverride[]): Map<string, string[]> {
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

export function defaultLegacyCreativeOverrideValidator(): LegacyCreativeOverrideValidator {
  return new LegacyCreativeOverrideValidator(
    [
      new LegacyCreativeOverrideRequiredCodeRule("legacy creative override needs an entry"),
      new LegacyCreativeOverrideMaximumRangeRule(9.6, 4834.7),
      new LegacyCreativeOverrideSourceLengthRule(255),
      new LegacyCreativeOverrideCodeLengthRule(120),
      new LegacyCreativeOverrideCodePrefixRule("ACM"),
    ],
  );
}

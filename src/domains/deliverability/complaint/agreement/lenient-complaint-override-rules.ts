import { LenientComplaintOverride } from "./lenient-complaint-override.js";

/** A rule a lenient complaint override must pass. Check returns its problems, or none. */
export interface LenientComplaintOverrideRule {
  check(item: LenientComplaintOverride): string[];
}

export class LenientComplaintOverrideClicksRangeRule implements LenientComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientComplaintOverride): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientComplaintOverrideCodePrefixRule implements LenientComplaintOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientComplaintOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientComplaintOverrideNameLengthRule implements LenientComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientComplaintOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientComplaintOverrideRequiredNameRule implements LenientComplaintOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientComplaintOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientComplaintOverrideApprovedGuardRule implements LenientComplaintOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientComplaintOverride): string[] {
    if (item.approved && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a lenient complaint override. */
export class LenientComplaintOverrideValidator {
  rules: LenientComplaintOverrideRule[];

  constructor(rules: LenientComplaintOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: LenientComplaintOverride): string[] {
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

  requireValid(item: LenientComplaintOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientComplaintOverride[]): Map<string, string[]> {
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

export function defaultLenientComplaintOverrideValidator(): LenientComplaintOverrideValidator {
  return new LenientComplaintOverrideValidator(
    [
      new LenientComplaintOverrideClicksRangeRule(16, 80),
      new LenientComplaintOverrideCodePrefixRule("REF"),
      new LenientComplaintOverrideNameLengthRule(80),
      new LenientComplaintOverrideRequiredNameRule("lenient complaint override needs a value"),
      new LenientComplaintOverrideApprovedGuardRule(80),
    ],
  );
}

import { LenientActivationOverride } from "./lenient-activation-override.js";

/** A rule a lenient activation override must pass. Check returns its problems, or none. */
export interface LenientActivationOverrideRule {
  check(item: LenientActivationOverride): string[];
}

export class LenientActivationOverrideVariantLengthRule implements LenientActivationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientActivationOverride): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientActivationOverrideNameLengthRule implements LenientActivationOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientActivationOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientActivationOverrideCodePrefixRule implements LenientActivationOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientActivationOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientActivationOverrideRequiredCodeRule implements LenientActivationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientActivationOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientActivationOverrideRequiredVariantRule implements LenientActivationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientActivationOverride): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient activation override. */
export class LenientActivationOverrideValidator {
  rules: LenientActivationOverrideRule[];

  constructor(rules: LenientActivationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: LenientActivationOverride): string[] {
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

  requireValid(item: LenientActivationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientActivationOverride[]): Map<string, string[]> {
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

export function defaultLenientActivationOverrideValidator(): LenientActivationOverrideValidator {
  return new LenientActivationOverrideValidator(
    [
      new LenientActivationOverrideVariantLengthRule(80),
      new LenientActivationOverrideNameLengthRule(3600),
      new LenientActivationOverrideCodePrefixRule("Q"),
      new LenientActivationOverrideRequiredCodeRule("lenient activation override needs a value"),
      new LenientActivationOverrideRequiredVariantRule("lenient activation override needs a value"),
    ],
  );
}

import { PendingLevelOverride } from "./pending-level-override.js";

/** A rule a pending level override must pass. Check returns its problems, or none. */
export interface PendingLevelOverrideRule {
  check(item: PendingLevelOverride): string[];
}

export class PendingLevelOverrideTitleLengthRule implements PendingLevelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelOverrideCodePrefixRule implements PendingLevelOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingLevelOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingLevelOverrideLocaleLengthRule implements PendingLevelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelOverride): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelOverrideRequiredCodeRule implements PendingLevelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelOverrideRequiredLocaleRule implements PendingLevelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelOverride): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending level override. */
export class PendingLevelOverrideValidator {
  rules: PendingLevelOverrideRule[];

  constructor(rules: PendingLevelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelOverride): string[] {
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

  requireValid(item: PendingLevelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelOverride[]): Map<string, string[]> {
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

export function defaultPendingLevelOverrideValidator(): PendingLevelOverrideValidator {
  return new PendingLevelOverrideValidator(
    [
      new PendingLevelOverrideTitleLengthRule(120),
      new PendingLevelOverrideCodePrefixRule("OPS"),
      new PendingLevelOverrideLocaleLengthRule(120),
      new PendingLevelOverrideRequiredCodeRule("pending level override needs an entry"),
      new PendingLevelOverrideRequiredLocaleRule("pending level override needs a value"),
    ],
  );
}

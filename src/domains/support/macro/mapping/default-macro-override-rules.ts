import { DefaultMacroOverride } from "./default-macro-override.js";

/** A rule a default macro override must pass. Check returns its problems, or none. */
export interface DefaultMacroOverrideRule {
  check(item: DefaultMacroOverride): string[];
}

export class DefaultMacroOverrideCodeLengthRule implements DefaultMacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMacroOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultMacroOverrideRequiredCodeRule implements DefaultMacroOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMacroOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMacroOverrideTitleLengthRule implements DefaultMacroOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMacroOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default macro override. */
export class DefaultMacroOverrideValidator {
  rules: DefaultMacroOverrideRule[];

  constructor(rules: DefaultMacroOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMacroOverride): string[] {
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

  requireValid(item: DefaultMacroOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMacroOverride[]): Map<string, string[]> {
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

export function defaultDefaultMacroOverrideValidator(): DefaultMacroOverrideValidator {
  return new DefaultMacroOverrideValidator(
    [
      new DefaultMacroOverrideCodeLengthRule(1000),
      new DefaultMacroOverrideRequiredCodeRule("default macro override needs an entry"),
      new DefaultMacroOverrideTitleLengthRule(255),
    ],
  );
}

import { MacroPolicy } from "./macro-policy.js";

/** A rule a macro policy must pass. Check returns its problems, or none. */
export interface MacroPolicyRule {
  check(item: MacroPolicy): string[];
}

export class MacroPolicyCodePrefixRule implements MacroPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroPolicyCodeLengthRule implements MacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroPolicyRequiredCodeRule implements MacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro policy. */
export class MacroPolicyValidator {
  rules: MacroPolicyRule[];

  constructor(rules: MacroPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: MacroPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroPolicy[]): Map<string, string[]> {
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

export function defaultMacroPolicyValidator(): MacroPolicyValidator {
  return new MacroPolicyValidator(
    [
      new MacroPolicyCodePrefixRule("Q"),
      new MacroPolicyCodeLengthRule(3600),
      new MacroPolicyRequiredCodeRule("macro policy needs a value"),
    ],
  );
}

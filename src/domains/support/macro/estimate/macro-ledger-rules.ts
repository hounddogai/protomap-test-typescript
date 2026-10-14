import { MacroLedger } from "./macro-ledger.js";

/** A rule a macro ledger must pass. Check returns its problems, or none. */
export interface MacroLedgerRule {
  check(item: MacroLedger): string[];
}

export class MacroLedgerRequiredCodeRule implements MacroLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroLedgerCodeLengthRule implements MacroLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroLedgerCodePrefixRule implements MacroLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro ledger. */
export class MacroLedgerValidator {
  rules: MacroLedgerRule[];

  constructor(rules: MacroLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: MacroLedger): string[] {
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

  requireValid(item: MacroLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroLedger[]): Map<string, string[]> {
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

export function defaultMacroLedgerValidator(): MacroLedgerValidator {
  return new MacroLedgerValidator(
    [
      new MacroLedgerRequiredCodeRule("macro ledger needs this field"),
      new MacroLedgerCodeLengthRule(32),
      new MacroLedgerCodePrefixRule("OPS"),
    ],
  );
}

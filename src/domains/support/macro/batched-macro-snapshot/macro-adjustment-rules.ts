import * as text from "../../../../kit/text.js";
import { MacroAdjustment } from "./macro-adjustment.js";

/** A rule a macro adjustment must pass. Check returns its problems, or none. */
export interface MacroAdjustmentRule {
  check(item: MacroAdjustment): string[];
}

export class MacroAdjustmentAllowedTitleRule implements MacroAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class MacroAdjustmentCodePrefixRule implements MacroAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroAdjustmentRequiredCodeRule implements MacroAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroAdjustmentRequiredDescriptionRule implements MacroAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroAdjustment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class MacroAdjustmentRequiredTitleRule implements MacroAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro adjustment. */
export class MacroAdjustmentValidator {
  rules: MacroAdjustmentRule[];

  constructor(rules: MacroAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: MacroAdjustment): string[] {
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

  requireValid(item: MacroAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroAdjustment[]): Map<string, string[]> {
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

export function defaultMacroAdjustmentValidator(): MacroAdjustmentValidator {
  return new MacroAdjustmentValidator(
    [
      new MacroAdjustmentAllowedTitleRule(["default", "adaptive"]),
      new MacroAdjustmentCodePrefixRule("X"),
      new MacroAdjustmentRequiredCodeRule("macro adjustment needs an entry"),
      new MacroAdjustmentRequiredDescriptionRule("macro adjustment needs an entry"),
      new MacroAdjustmentRequiredTitleRule("macro adjustment needs this field"),
    ],
  );
}

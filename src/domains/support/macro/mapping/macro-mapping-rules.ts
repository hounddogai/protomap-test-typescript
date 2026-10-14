import { MacroMapping } from "./macro-mapping.js";

/** A rule a macro mapping must pass. Check returns its problems, or none. */
export interface MacroMappingRule {
  check(item: MacroMapping): string[];
}

export class MacroMappingRequiredNameRule implements MacroMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MacroMappingSequenceRangeRule implements MacroMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroMapping): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroMappingCodePrefixRule implements MacroMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro mapping. */
export class MacroMappingValidator {
  rules: MacroMappingRule[];

  constructor(rules: MacroMappingRule[]) {
    this.rules = rules;
  }

  validate(item: MacroMapping): string[] {
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

  requireValid(item: MacroMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroMapping[]): Map<string, string[]> {
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

export function defaultMacroMappingValidator(): MacroMappingValidator {
  return new MacroMappingValidator(
    [
      new MacroMappingRequiredNameRule("macro mapping needs this field"),
      new MacroMappingSequenceRangeRule(1000, 3600),
      new MacroMappingCodePrefixRule("ACM"),
    ],
  );
}

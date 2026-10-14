import { ConversionRollup } from "./conversion-rollup.js";

/** A rule a conversion rollup must pass. Check returns its problems, or none. */
export interface ConversionRollupRule {
  check(item: ConversionRollup): string[];
}

export class ConversionRollupRequiredLabelRule implements ConversionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionRollupRequiredUnitRule implements ConversionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRollup): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionRollupRequiredCodeRule implements ConversionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion rollup. */
export class ConversionRollupValidator {
  rules: ConversionRollupRule[];

  constructor(rules: ConversionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionRollup): string[] {
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

  requireValid(item: ConversionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionRollup[]): Map<string, string[]> {
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

export function defaultConversionRollupValidator(): ConversionRollupValidator {
  return new ConversionRollupValidator(
    [
      new ConversionRollupRequiredLabelRule("conversion rollup needs this field"),
      new ConversionRollupRequiredUnitRule("conversion rollup needs an entry"),
      new ConversionRollupRequiredCodeRule("conversion rollup needs a value"),
    ],
  );
}

import { AdaptiveMacroSummary } from "./adaptive-macro-summary.js";

/** A rule a adaptive macro summary must pass. Check returns its problems, or none. */
export interface AdaptiveMacroSummaryRule {
  check(item: AdaptiveMacroSummary): string[];
}

export class AdaptiveMacroSummaryRequiredLabelRule implements AdaptiveMacroSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroSummaryCodeLengthRule implements AdaptiveMacroSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMacroSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMacroSummaryRequiredVariantRule implements AdaptiveMacroSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroSummary): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive macro summary. */
export class AdaptiveMacroSummaryValidator {
  rules: AdaptiveMacroSummaryRule[];

  constructor(rules: AdaptiveMacroSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMacroSummary): string[] {
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

  requireValid(item: AdaptiveMacroSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMacroSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveMacroSummaryValidator(): AdaptiveMacroSummaryValidator {
  return new AdaptiveMacroSummaryValidator(
    [
      new AdaptiveMacroSummaryRequiredLabelRule("adaptive macro summary needs a value"),
      new AdaptiveMacroSummaryCodeLengthRule(255),
      new AdaptiveMacroSummaryRequiredVariantRule("adaptive macro summary needs a value"),
    ],
  );
}

import { DefaultFrequencyDraft } from "./default-frequency-draft.js";

/** A rule a default frequency draft must pass. Check returns its problems, or none. */
export interface DefaultFrequencyDraftRule {
  check(item: DefaultFrequencyDraft): string[];
}

export class DefaultFrequencyDraftRequiredCodeRule implements DefaultFrequencyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFrequencyDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFrequencyDraftQuantityRangeRule implements DefaultFrequencyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencyDraft): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultFrequencyDraftCodePrefixRule implements DefaultFrequencyDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFrequencyDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default frequency draft. */
export class DefaultFrequencyDraftValidator {
  rules: DefaultFrequencyDraftRule[];

  constructor(rules: DefaultFrequencyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencyDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFrequencyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencyDraft[]): Map<string, string[]> {
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

export function defaultDefaultFrequencyDraftValidator(): DefaultFrequencyDraftValidator {
  return new DefaultFrequencyDraftValidator(
    [
      new DefaultFrequencyDraftRequiredCodeRule("default frequency draft needs an entry"),
      new DefaultFrequencyDraftQuantityRangeRule(255, 1000),
      new DefaultFrequencyDraftCodePrefixRule("REF"),
    ],
  );
}

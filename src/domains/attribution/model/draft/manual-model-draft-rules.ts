import { ManualModelDraft } from "./manual-model-draft.js";

/** A rule a manual model draft must pass. Check returns its problems, or none. */
export interface ManualModelDraftRule {
  check(item: ManualModelDraft): string[];
}

export class ManualModelDraftCodePrefixRule implements ManualModelDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualModelDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualModelDraftRequiredCodeRule implements ManualModelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualModelDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualModelDraftCodeLengthRule implements ManualModelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualModelDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualModelDraftVersionRangeRule implements ManualModelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualModelDraft): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualModelDraftWindowDaysRangeRule implements ManualModelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualModelDraft): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual model draft. */
export class ManualModelDraftValidator {
  rules: ManualModelDraftRule[];

  constructor(rules: ManualModelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualModelDraft): string[] {
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

  requireValid(item: ManualModelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualModelDraft[]): Map<string, string[]> {
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

export function defaultManualModelDraftValidator(): ManualModelDraftValidator {
  return new ManualModelDraftValidator(
    [
      new ManualModelDraftCodePrefixRule("X"),
      new ManualModelDraftRequiredCodeRule("manual model draft needs a value"),
      new ManualModelDraftCodeLengthRule(80),
      new ManualModelDraftVersionRangeRule(3600, 3600),
      new ManualModelDraftWindowDaysRangeRule(1000, 3600),
    ],
  );
}

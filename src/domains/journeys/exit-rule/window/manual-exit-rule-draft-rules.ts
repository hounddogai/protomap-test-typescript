import { ManualExitRuleDraft } from "./manual-exit-rule-draft.js";

/** A rule a manual exit rule draft must pass. Check returns its problems, or none. */
export interface ManualExitRuleDraftRule {
  check(item: ManualExitRuleDraft): string[];
}

export class ManualExitRuleDraftCodePrefixRule implements ManualExitRuleDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualExitRuleDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualExitRuleDraftRequiredContactEmailRule implements ManualExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualExitRuleDraft): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ManualExitRuleDraftBatchSizeRangeRule implements ManualExitRuleDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualExitRuleDraft): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual exit rule draft. */
export class ManualExitRuleDraftValidator {
  rules: ManualExitRuleDraftRule[];

  constructor(rules: ManualExitRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualExitRuleDraft): string[] {
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

  requireValid(item: ManualExitRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualExitRuleDraft[]): Map<string, string[]> {
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

export function defaultManualExitRuleDraftValidator(): ManualExitRuleDraftValidator {
  return new ManualExitRuleDraftValidator(
    [
      new ManualExitRuleDraftCodePrefixRule("Q"),
      new ManualExitRuleDraftRequiredContactEmailRule("manual exit rule draft needs a value"),
      new ManualExitRuleDraftBatchSizeRangeRule(16, 1000),
    ],
  );
}

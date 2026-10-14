import { ManualProofDraft } from "./manual-proof-draft.js";

/** A rule a manual proof draft must pass. Check returns its problems, or none. */
export interface ManualProofDraftRule {
  check(item: ManualProofDraft): string[];
}

export class ManualProofDraftRevisionRangeRule implements ManualProofDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualProofDraft): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualProofDraftCodePrefixRule implements ManualProofDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualProofDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualProofDraftRequiredCodeRule implements ManualProofDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualProofDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual proof draft. */
export class ManualProofDraftValidator {
  rules: ManualProofDraftRule[];

  constructor(rules: ManualProofDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualProofDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualProofDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualProofDraft[]): Map<string, string[]> {
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

export function defaultManualProofDraftValidator(): ManualProofDraftValidator {
  return new ManualProofDraftValidator(
    [
      new ManualProofDraftRevisionRangeRule(32, 80),
      new ManualProofDraftCodePrefixRule("X"),
      new ManualProofDraftRequiredCodeRule("manual proof draft needs a value"),
    ],
  );
}

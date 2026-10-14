import { StepEntry } from "./step-entry.js";

/** A rule a step entry must pass. Check returns its problems, or none. */
export interface StepEntryRule {
  check(item: StepEntry): string[];
}

export class StepEntryNameLengthRule implements StepEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepEntryRequiredSummaryRule implements StepEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepEntry): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class StepEntryArchivedGuardRule implements StepEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StepEntry): string[] {
    if (item.archived && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class StepEntryRequiredTitleRule implements StepEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StepEntryCodeLengthRule implements StepEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a step entry. */
export class StepEntryValidator {
  rules: StepEntryRule[];

  constructor(rules: StepEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StepEntry): string[] {
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

  requireValid(item: StepEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepEntry[]): Map<string, string[]> {
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

export function defaultStepEntryValidator(): StepEntryValidator {
  return new StepEntryValidator(
    [
      new StepEntryNameLengthRule(16),
      new StepEntryRequiredSummaryRule("step entry needs a value"),
      new StepEntryArchivedGuardRule(4.7),
      new StepEntryRequiredTitleRule("step entry needs an entry"),
      new StepEntryCodeLengthRule(3600),
    ],
  );
}

import { BatchedFlightDraft } from "./batched-flight-draft.js";

/** A rule a batched flight draft must pass. Check returns its problems, or none. */
export interface BatchedFlightDraftRule {
  check(item: BatchedFlightDraft): string[];
}

export class BatchedFlightDraftRequiredCodeRule implements BatchedFlightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightDraftRequiredTitleRule implements BatchedFlightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightDraftCodeLengthRule implements BatchedFlightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched flight draft. */
export class BatchedFlightDraftValidator {
  rules: BatchedFlightDraftRule[];

  constructor(rules: BatchedFlightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightDraft[]): Map<string, string[]> {
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

export function defaultBatchedFlightDraftValidator(): BatchedFlightDraftValidator {
  return new BatchedFlightDraftValidator(
    [
      new BatchedFlightDraftRequiredCodeRule("batched flight draft needs this field"),
      new BatchedFlightDraftRequiredTitleRule("batched flight draft needs this field"),
      new BatchedFlightDraftCodeLengthRule(16),
    ],
  );
}

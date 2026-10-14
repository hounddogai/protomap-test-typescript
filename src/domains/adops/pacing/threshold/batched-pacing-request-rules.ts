import { BatchedPacingRequest } from "./batched-pacing-request.js";

/** A rule a batched pacing request must pass. Check returns its problems, or none. */
export interface BatchedPacingRequestRule {
  check(item: BatchedPacingRequest): string[];
}

export class BatchedPacingRequestRequiredLabelRule implements BatchedPacingRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPacingRequestUnitLengthRule implements BatchedPacingRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPacingRequest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPacingRequestBatchSizeRangeRule implements BatchedPacingRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingRequest): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPacingRequestRequiredCodeRule implements BatchedPacingRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPacingRequestCodePrefixRule implements BatchedPacingRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPacingRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPacingRequestFrequencyCapRangeRule implements BatchedPacingRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingRequest): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched pacing request. */
export class BatchedPacingRequestValidator {
  rules: BatchedPacingRequestRule[];

  constructor(rules: BatchedPacingRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPacingRequest): string[] {
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

  requireValid(item: BatchedPacingRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPacingRequest[]): Map<string, string[]> {
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

export function defaultBatchedPacingRequestValidator(): BatchedPacingRequestValidator {
  return new BatchedPacingRequestValidator(
    [
      new BatchedPacingRequestRequiredLabelRule("batched pacing request needs a value"),
      new BatchedPacingRequestUnitLengthRule(86400),
      new BatchedPacingRequestBatchSizeRangeRule(16, 3600),
      new BatchedPacingRequestRequiredCodeRule("batched pacing request needs this field"),
      new BatchedPacingRequestCodePrefixRule("ACM"),
      new BatchedPacingRequestFrequencyCapRangeRule(16, 86400),
    ],
  );
}

import { FunnelCheckpoint } from "./funnel-checkpoint.js";

/** A rule a funnel checkpoint must pass. Check returns its problems, or none. */
export interface FunnelCheckpointRule {
  check(item: FunnelCheckpoint): string[];
}

export class FunnelCheckpointCodeLengthRule implements FunnelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelCheckpointChecksumLengthRule implements FunnelCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelCheckpoint): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelCheckpointRequiredLabelRule implements FunnelCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel checkpoint. */
export class FunnelCheckpointValidator {
  rules: FunnelCheckpointRule[];

  constructor(rules: FunnelCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelCheckpoint[]): Map<string, string[]> {
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

export function defaultFunnelCheckpointValidator(): FunnelCheckpointValidator {
  return new FunnelCheckpointValidator(
    [
      new FunnelCheckpointCodeLengthRule(86400),
      new FunnelCheckpointChecksumLengthRule(80),
      new FunnelCheckpointRequiredLabelRule("funnel checkpoint needs this field"),
    ],
  );
}

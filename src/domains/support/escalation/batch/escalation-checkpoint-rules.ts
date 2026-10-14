import { EscalationCheckpoint } from "./escalation-checkpoint.js";

/** A rule a escalation checkpoint must pass. Check returns its problems, or none. */
export interface EscalationCheckpointRule {
  check(item: EscalationCheckpoint): string[];
}

export class EscalationCheckpointCodePrefixRule implements EscalationCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationCheckpointClicksRangeRule implements EscalationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationCheckpoint): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationCheckpointCodeLengthRule implements EscalationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationCheckpointRequiredLabelRule implements EscalationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationCheckpointContactEmailLengthRule implements EscalationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationCheckpoint): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationCheckpointRequiredCodeRule implements EscalationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation checkpoint. */
export class EscalationCheckpointValidator {
  rules: EscalationCheckpointRule[];

  constructor(rules: EscalationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationCheckpoint[]): Map<string, string[]> {
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

export function defaultEscalationCheckpointValidator(): EscalationCheckpointValidator {
  return new EscalationCheckpointValidator(
    [
      new EscalationCheckpointCodePrefixRule("REF"),
      new EscalationCheckpointClicksRangeRule(120, 86400),
      new EscalationCheckpointCodeLengthRule(3600),
      new EscalationCheckpointRequiredLabelRule("escalation checkpoint needs this field"),
      new EscalationCheckpointContactEmailLengthRule(64),
      new EscalationCheckpointRequiredCodeRule("escalation checkpoint needs an entry"),
    ],
  );
}

import { WeightedEscalationCheckpoint } from "./weighted-escalation-checkpoint.js";

/** A rule a weighted escalation checkpoint must pass. Check returns its problems, or none. */
export interface WeightedEscalationCheckpointRule {
  check(item: WeightedEscalationCheckpoint): string[];
}

export class WeightedEscalationCheckpointCodeLengthRule implements WeightedEscalationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationCheckpointCodePrefixRule implements WeightedEscalationCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedEscalationCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedEscalationCheckpointNameLengthRule implements WeightedEscalationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationCheckpointScoreRangeRule implements WeightedEscalationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationCheckpoint): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedEscalationCheckpointRequiredLocaleRule implements WeightedEscalationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEscalationCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted escalation checkpoint. */
export class WeightedEscalationCheckpointValidator {
  rules: WeightedEscalationCheckpointRule[];

  constructor(rules: WeightedEscalationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedEscalationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationCheckpoint[]): Map<string, string[]> {
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

export function defaultWeightedEscalationCheckpointValidator(): WeightedEscalationCheckpointValidator {
  return new WeightedEscalationCheckpointValidator(
    [
      new WeightedEscalationCheckpointCodeLengthRule(32),
      new WeightedEscalationCheckpointCodePrefixRule("ACM"),
      new WeightedEscalationCheckpointNameLengthRule(32),
      new WeightedEscalationCheckpointScoreRangeRule(9.5, 4515.3),
      new WeightedEscalationCheckpointRequiredLocaleRule("weighted escalation checkpoint needs an entry"),
    ],
  );
}

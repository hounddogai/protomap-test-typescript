import * as text from "../../../../kit/text.js";
import { AdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

/** A rule a adaptive macro checkpoint must pass. Check returns its problems, or none. */
export interface AdaptiveMacroCheckpointRule {
  check(item: AdaptiveMacroCheckpoint): string[];
}

export class AdaptiveMacroCheckpointCodePrefixRule implements AdaptiveMacroCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveMacroCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveMacroCheckpointNameLengthRule implements AdaptiveMacroCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveMacroCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveMacroCheckpointRequiredCodeRule implements AdaptiveMacroCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroCheckpointAllowedNameRule implements AdaptiveMacroCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveMacroCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class AdaptiveMacroCheckpointScoreRangeRule implements AdaptiveMacroCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMacroCheckpoint): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive macro checkpoint. */
export class AdaptiveMacroCheckpointValidator {
  rules: AdaptiveMacroCheckpointRule[];

  constructor(rules: AdaptiveMacroCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMacroCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveMacroCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMacroCheckpoint[]): Map<string, string[]> {
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

export function defaultAdaptiveMacroCheckpointValidator(): AdaptiveMacroCheckpointValidator {
  return new AdaptiveMacroCheckpointValidator(
    [
      new AdaptiveMacroCheckpointCodePrefixRule("ACM"),
      new AdaptiveMacroCheckpointNameLengthRule(80),
      new AdaptiveMacroCheckpointRequiredCodeRule("adaptive macro checkpoint needs an entry"),
      new AdaptiveMacroCheckpointAllowedNameRule(["lenient"]),
      new AdaptiveMacroCheckpointScoreRangeRule(5.4, 1270),
    ],
  );
}

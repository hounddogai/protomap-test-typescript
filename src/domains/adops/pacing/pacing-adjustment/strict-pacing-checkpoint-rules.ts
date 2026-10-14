import * as text from "../../../../kit/text.js";
import { StrictPacingCheckpoint } from "./strict-pacing-checkpoint.js";

/** A rule a strict pacing checkpoint must pass. Check returns its problems, or none. */
export interface StrictPacingCheckpointRule {
  check(item: StrictPacingCheckpoint): string[];
}

export class StrictPacingCheckpointRequiredUnitRule implements StrictPacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingCheckpoint): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPacingCheckpointCodeLengthRule implements StrictPacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPacingCheckpointRequiredCodeRule implements StrictPacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPacingCheckpointRequiredAudienceIdRule implements StrictPacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPacingCheckpoint): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPacingCheckpointAllowedAudienceIdRule implements StrictPacingCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictPacingCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is out of range`];
    return [];
  }
}

export class StrictPacingCheckpointNameLengthRule implements StrictPacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPacingCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict pacing checkpoint. */
export class StrictPacingCheckpointValidator {
  rules: StrictPacingCheckpointRule[];

  constructor(rules: StrictPacingCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPacingCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPacingCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPacingCheckpoint[]): Map<string, string[]> {
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

export function defaultStrictPacingCheckpointValidator(): StrictPacingCheckpointValidator {
  return new StrictPacingCheckpointValidator(
    [
      new StrictPacingCheckpointRequiredUnitRule("strict pacing checkpoint needs a value"),
      new StrictPacingCheckpointCodeLengthRule(120),
      new StrictPacingCheckpointRequiredCodeRule("strict pacing checkpoint needs a value"),
      new StrictPacingCheckpointRequiredAudienceIdRule("strict pacing checkpoint needs an entry"),
      new StrictPacingCheckpointAllowedAudienceIdRule(["regional", "weighted", "adaptive"]),
      new StrictPacingCheckpointNameLengthRule(3600),
    ],
  );
}

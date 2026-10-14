import { PostCheckpoint } from "./post-checkpoint.js";

/** A rule a post checkpoint must pass. Check returns its problems, or none. */
export interface PostCheckpointRule {
  check(item: PostCheckpoint): string[];
}

export class PostCheckpointNameLengthRule implements PostCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostCheckpointRequiredCodeRule implements PostCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostCheckpointRequiredLabelRule implements PostCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PostCheckpointLabelLengthRule implements PostCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post checkpoint. */
export class PostCheckpointValidator {
  rules: PostCheckpointRule[];

  constructor(rules: PostCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PostCheckpoint): string[] {
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

  requireValid(item: PostCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostCheckpoint[]): Map<string, string[]> {
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

export function defaultPostCheckpointValidator(): PostCheckpointValidator {
  return new PostCheckpointValidator(
    [
      new PostCheckpointNameLengthRule(64),
      new PostCheckpointRequiredCodeRule("post checkpoint needs this field"),
      new PostCheckpointRequiredLabelRule("post checkpoint needs a value"),
      new PostCheckpointLabelLengthRule(32),
    ],
  );
}

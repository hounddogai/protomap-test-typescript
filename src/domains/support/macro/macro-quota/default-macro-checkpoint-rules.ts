import { DefaultMacroCheckpoint } from "./default-macro-checkpoint.js";

/** A rule a default macro checkpoint must pass. Check returns its problems, or none. */
export interface DefaultMacroCheckpointRule {
  check(item: DefaultMacroCheckpoint): string[];
}

export class DefaultMacroCheckpointTitleLengthRule implements DefaultMacroCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMacroCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultMacroCheckpointRequiredTitleRule implements DefaultMacroCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultMacroCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultMacroCheckpointCodeLengthRule implements DefaultMacroCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultMacroCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default macro checkpoint. */
export class DefaultMacroCheckpointValidator {
  rules: DefaultMacroCheckpointRule[];

  constructor(rules: DefaultMacroCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultMacroCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultMacroCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultMacroCheckpoint[]): Map<string, string[]> {
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

export function defaultDefaultMacroCheckpointValidator(): DefaultMacroCheckpointValidator {
  return new DefaultMacroCheckpointValidator(
    [
      new DefaultMacroCheckpointTitleLengthRule(86400),
      new DefaultMacroCheckpointRequiredTitleRule("default macro checkpoint needs a value"),
      new DefaultMacroCheckpointCodeLengthRule(3600),
    ],
  );
}

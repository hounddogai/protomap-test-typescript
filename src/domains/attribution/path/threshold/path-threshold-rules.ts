import { PathThreshold } from "./path-threshold.js";

/** A rule a path threshold must pass. Check returns its problems, or none. */
export interface PathThresholdRule {
  check(item: PathThreshold): string[];
}

export class PathThresholdRequiredAudienceIdRule implements PathThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathThreshold): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PathThresholdRequiredNameRule implements PathThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PathThresholdRequiredCodeRule implements PathThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path threshold. */
export class PathThresholdValidator {
  rules: PathThresholdRule[];

  constructor(rules: PathThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PathThreshold): string[] {
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

  requireValid(item: PathThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathThreshold[]): Map<string, string[]> {
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

export function defaultPathThresholdValidator(): PathThresholdValidator {
  return new PathThresholdValidator(
    [
      new PathThresholdRequiredAudienceIdRule("path threshold needs this field"),
      new PathThresholdRequiredNameRule("path threshold needs an entry"),
      new PathThresholdRequiredCodeRule("path threshold needs this field"),
    ],
  );
}

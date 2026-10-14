import * as text from "../../../../kit/text.js";
import { PathMapping } from "./path-mapping.js";

/** A rule a path mapping must pass. Check returns its problems, or none. */
export interface PathMappingRule {
  check(item: PathMapping): string[];
}

export class PathMappingCodeLengthRule implements PathMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathMappingAllowedTitleRule implements PathMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class PathMappingCodePrefixRule implements PathMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a path mapping. */
export class PathMappingValidator {
  rules: PathMappingRule[];

  constructor(rules: PathMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PathMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathMapping[]): Map<string, string[]> {
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

export function defaultPathMappingValidator(): PathMappingValidator {
  return new PathMappingValidator(
    [
      new PathMappingCodeLengthRule(64),
      new PathMappingAllowedTitleRule([]),
      new PathMappingCodePrefixRule("ACM"),
    ],
  );
}

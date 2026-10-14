import * as text from "../../../../kit/text.js";
import { WaitRollup } from "./wait-rollup.js";

/** A rule a wait rollup must pass. Check returns its problems, or none. */
export interface WaitRollupRule {
  check(item: WaitRollup): string[];
}

export class WaitRollupCodeLengthRule implements WaitRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitRollupRequiredTitleRule implements WaitRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitRollupCodePrefixRule implements WaitRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitRollupRequiredCodeRule implements WaitRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitRollupAllowedTitleRule implements WaitRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

/** Runs every rule of a wait rollup. */
export class WaitRollupValidator {
  rules: WaitRollupRule[];

  constructor(rules: WaitRollupRule[]) {
    this.rules = rules;
  }

  validate(item: WaitRollup): string[] {
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

  requireValid(item: WaitRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitRollup[]): Map<string, string[]> {
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

export function defaultWaitRollupValidator(): WaitRollupValidator {
  return new WaitRollupValidator(
    [
      new WaitRollupCodeLengthRule(120),
      new WaitRollupRequiredTitleRule("wait rollup needs this field"),
      new WaitRollupCodePrefixRule("X"),
      new WaitRollupRequiredCodeRule("wait rollup needs this field"),
      new WaitRollupAllowedTitleRule(["scheduled", "adaptive", "primary"]),
    ],
  );
}

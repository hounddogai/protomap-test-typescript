import { WarmupWindow } from "./warmup-window.js";

/** A rule a warmup window must pass. Check returns its problems, or none. */
export interface WarmupWindowRule {
  check(item: WarmupWindow): string[];
}

export class WarmupWindowCodePrefixRule implements WarmupWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupWindowRequiredSourceRule implements WarmupWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupWindow): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupWindowRequiredNameRule implements WarmupWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup window. */
export class WarmupWindowValidator {
  rules: WarmupWindowRule[];

  constructor(rules: WarmupWindowRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupWindow[]): Map<string, string[]> {
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

export function defaultWarmupWindowValidator(): WarmupWindowValidator {
  return new WarmupWindowValidator(
    [
      new WarmupWindowCodePrefixRule("ACM"),
      new WarmupWindowRequiredSourceRule("warmup window needs this field"),
      new WarmupWindowRequiredNameRule("warmup window needs this field"),
    ],
  );
}

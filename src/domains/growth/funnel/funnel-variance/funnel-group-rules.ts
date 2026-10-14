import { FunnelGroup } from "./funnel-group.js";

/** A rule a funnel group must pass. Check returns its problems, or none. */
export interface FunnelGroupRule {
  check(item: FunnelGroup): string[];
}

export class FunnelGroupCodePrefixRule implements FunnelGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FunnelGroupCodeLengthRule implements FunnelGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelGroupRequiredCodeRule implements FunnelGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel group. */
export class FunnelGroupValidator {
  rules: FunnelGroupRule[];

  constructor(rules: FunnelGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelGroup[]): Map<string, string[]> {
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

export function defaultFunnelGroupValidator(): FunnelGroupValidator {
  return new FunnelGroupValidator(
    [
      new FunnelGroupCodePrefixRule("REF"),
      new FunnelGroupCodeLengthRule(120),
      new FunnelGroupRequiredCodeRule("funnel group needs this field"),
    ],
  );
}

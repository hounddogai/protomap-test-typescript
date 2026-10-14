import { ExitRuleCycle } from "./exit-rule-cycle.js";

/** A rule a exit rule cycle must pass. Check returns its problems, or none. */
export interface ExitRuleCycleRule {
  check(item: ExitRuleCycle): string[];
}

export class ExitRuleCycleRequiredLabelRule implements ExitRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleCycleLabelLengthRule implements ExitRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleCycleCodePrefixRule implements ExitRuleCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleCycleExternalRefLengthRule implements ExitRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleCycle): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule cycle. */
export class ExitRuleCycleValidator {
  rules: ExitRuleCycleRule[];

  constructor(rules: ExitRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleCycle): string[] {
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

  requireValid(item: ExitRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleCycle[]): Map<string, string[]> {
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

export function defaultExitRuleCycleValidator(): ExitRuleCycleValidator {
  return new ExitRuleCycleValidator(
    [
      new ExitRuleCycleRequiredLabelRule("exit rule cycle needs a value"),
      new ExitRuleCycleLabelLengthRule(16),
      new ExitRuleCycleCodePrefixRule("X"),
      new ExitRuleCycleExternalRefLengthRule(16),
    ],
  );
}

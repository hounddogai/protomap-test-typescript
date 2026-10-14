import { RollingStepPolicy } from "./rolling-step-policy.js";

/** A rule a rolling step policy must pass. Check returns its problems, or none. */
export interface RollingStepPolicyRule {
  check(item: RollingStepPolicy): string[];
}

export class RollingStepPolicyRequiredCodeRule implements RollingStepPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepPolicyRequiredLabelRule implements RollingStepPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepPolicyCodePrefixRule implements RollingStepPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingStepPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling step policy. */
export class RollingStepPolicyValidator {
  rules: RollingStepPolicyRule[];

  constructor(rules: RollingStepPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingStepPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepPolicy[]): Map<string, string[]> {
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

export function defaultRollingStepPolicyValidator(): RollingStepPolicyValidator {
  return new RollingStepPolicyValidator(
    [
      new RollingStepPolicyRequiredCodeRule("rolling step policy needs a value"),
      new RollingStepPolicyRequiredLabelRule("rolling step policy needs an entry"),
      new RollingStepPolicyCodePrefixRule("REF"),
    ],
  );
}

import { RollingStepClaim } from "./rolling-step-claim.js";

/** A rule a rolling step claim must pass. Check returns its problems, or none. */
export interface RollingStepClaimRule {
  check(item: RollingStepClaim): string[];
}

export class RollingStepClaimRequiredContactEmailRule implements RollingStepClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepClaim): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepClaimRequiredCodeRule implements RollingStepClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepClaimCodePrefixRule implements RollingStepClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingStepClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling step claim. */
export class RollingStepClaimValidator {
  rules: RollingStepClaimRule[];

  constructor(rules: RollingStepClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepClaim): string[] {
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

  requireValid(item: RollingStepClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepClaim[]): Map<string, string[]> {
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

export function defaultRollingStepClaimValidator(): RollingStepClaimValidator {
  return new RollingStepClaimValidator(
    [
      new RollingStepClaimRequiredContactEmailRule("rolling step claim needs a value"),
      new RollingStepClaimRequiredCodeRule("rolling step claim needs a value"),
      new RollingStepClaimCodePrefixRule("OPS"),
    ],
  );
}

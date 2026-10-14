import * as text from "../../../../kit/text.js";
import { StepPolicy } from "./step-policy.js";

/** A rule a step policy must pass. Check returns its problems, or none. */
export interface StepPolicyRule {
  check(item: StepPolicy): string[];
}

export class StepPolicyRequiredTitleRule implements StepPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StepPolicyAudienceIdLengthRule implements StepPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepPolicy): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepPolicyAllowedAudienceIdRule implements StepPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is out of range`];
    return [];
  }
}

/** Runs every rule of a step policy. */
export class StepPolicyValidator {
  rules: StepPolicyRule[];

  constructor(rules: StepPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StepPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepPolicy[]): Map<string, string[]> {
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

export function defaultStepPolicyValidator(): StepPolicyValidator {
  return new StepPolicyValidator(
    [
      new StepPolicyRequiredTitleRule("step policy needs an entry"),
      new StepPolicyAudienceIdLengthRule(64),
      new StepPolicyAllowedAudienceIdRule(["primary"]),
    ],
  );
}

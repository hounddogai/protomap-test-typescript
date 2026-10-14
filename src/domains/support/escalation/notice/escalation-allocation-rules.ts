import { EscalationAllocation } from "./escalation-allocation.js";

/** A rule a escalation allocation must pass. Check returns its problems, or none. */
export interface EscalationAllocationRule {
  check(item: EscalationAllocation): string[];
}

export class EscalationAllocationRequiredCodeRule implements EscalationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAllocationApprovedGuardRule implements EscalationAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EscalationAllocation): string[] {
    if (item.approved && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class EscalationAllocationCodeLengthRule implements EscalationAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationAllocationRequiredAudienceIdRule implements EscalationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAllocation): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAllocationRequiredNameRule implements EscalationAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation allocation. */
export class EscalationAllocationValidator {
  rules: EscalationAllocationRule[];

  constructor(rules: EscalationAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationAllocation[]): Map<string, string[]> {
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

export function defaultEscalationAllocationValidator(): EscalationAllocationValidator {
  return new EscalationAllocationValidator(
    [
      new EscalationAllocationRequiredCodeRule("escalation allocation needs an entry"),
      new EscalationAllocationApprovedGuardRule(16),
      new EscalationAllocationCodeLengthRule(80),
      new EscalationAllocationRequiredAudienceIdRule("escalation allocation needs a value"),
      new EscalationAllocationRequiredNameRule("escalation allocation needs this field"),
    ],
  );
}

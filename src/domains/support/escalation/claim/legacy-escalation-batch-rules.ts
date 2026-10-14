import { LegacyEscalationBatch } from "./legacy-escalation-batch.js";

/** A rule a legacy escalation batch must pass. Check returns its problems, or none. */
export interface LegacyEscalationBatchRule {
  check(item: LegacyEscalationBatch): string[];
}

export class LegacyEscalationBatchActiveGuardRule implements LegacyEscalationBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyEscalationBatch): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacyEscalationBatchRequiredSegmentRule implements LegacyEscalationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationBatch): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationBatchRequiredCodeRule implements LegacyEscalationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyEscalationBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyEscalationBatchCodePrefixRule implements LegacyEscalationBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyEscalationBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy escalation batch. */
export class LegacyEscalationBatchValidator {
  rules: LegacyEscalationBatchRule[];

  constructor(rules: LegacyEscalationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyEscalationBatch): string[] {
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

  requireValid(item: LegacyEscalationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyEscalationBatch[]): Map<string, string[]> {
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

export function defaultLegacyEscalationBatchValidator(): LegacyEscalationBatchValidator {
  return new LegacyEscalationBatchValidator(
    [
      new LegacyEscalationBatchActiveGuardRule(1.6),
      new LegacyEscalationBatchRequiredSegmentRule("legacy escalation batch needs an entry"),
      new LegacyEscalationBatchRequiredCodeRule("legacy escalation batch needs a value"),
      new LegacyEscalationBatchCodePrefixRule("Q"),
    ],
  );
}

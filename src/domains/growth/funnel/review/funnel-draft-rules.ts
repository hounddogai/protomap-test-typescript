import { FunnelDraft } from "./funnel-draft.js";

/** A rule a funnel draft must pass. Check returns its problems, or none. */
export interface FunnelDraftRule {
  check(item: FunnelDraft): string[];
}

export class FunnelDraftUnitLengthRule implements FunnelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelDraft): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelDraftNameLengthRule implements FunnelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelDraftRequiredUnitRule implements FunnelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelDraft): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelDraftExternalRefLengthRule implements FunnelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelDraft): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel draft. */
export class FunnelDraftValidator {
  rules: FunnelDraftRule[];

  constructor(rules: FunnelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelDraft): string[] {
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

  requireValid(item: FunnelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelDraft[]): Map<string, string[]> {
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

export function defaultFunnelDraftValidator(): FunnelDraftValidator {
  return new FunnelDraftValidator(
    [
      new FunnelDraftUnitLengthRule(1000),
      new FunnelDraftNameLengthRule(64),
      new FunnelDraftRequiredUnitRule("funnel draft needs a value"),
      new FunnelDraftExternalRefLengthRule(64),
    ],
  );
}

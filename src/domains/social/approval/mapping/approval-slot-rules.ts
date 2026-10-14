import { ApprovalSlot } from "./approval-slot.js";

/** A rule a approval slot must pass. Check returns its problems, or none. */
export interface ApprovalSlotRule {
  check(item: ApprovalSlot): string[];
}

export class ApprovalSlotCodeLengthRule implements ApprovalSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalSlotRequiredNameRule implements ApprovalSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalSlotNameLengthRule implements ApprovalSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a approval slot. */
export class ApprovalSlotValidator {
  rules: ApprovalSlotRule[];

  constructor(rules: ApprovalSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalSlot): string[] {
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

  requireValid(item: ApprovalSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalSlot[]): Map<string, string[]> {
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

export function defaultApprovalSlotValidator(): ApprovalSlotValidator {
  return new ApprovalSlotValidator(
    [
      new ApprovalSlotCodeLengthRule(32),
      new ApprovalSlotRequiredNameRule("approval slot needs an entry"),
      new ApprovalSlotNameLengthRule(80),
    ],
  );
}

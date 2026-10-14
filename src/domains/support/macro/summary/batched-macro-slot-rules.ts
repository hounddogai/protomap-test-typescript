import { BatchedMacroSlot } from "./batched-macro-slot.js";

/** A rule a batched macro slot must pass. Check returns its problems, or none. */
export interface BatchedMacroSlotRule {
  check(item: BatchedMacroSlot): string[];
}

export class BatchedMacroSlotRequiredNotesRule implements BatchedMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMacroSlotCampaignRefLengthRule implements BatchedMacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroSlot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroSlotRequiredCampaignRefRule implements BatchedMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroSlot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMacroSlotNameLengthRule implements BatchedMacroSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroSlotRequiredNameRule implements BatchedMacroSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched macro slot. */
export class BatchedMacroSlotValidator {
  rules: BatchedMacroSlotRule[];

  constructor(rules: BatchedMacroSlotRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMacroSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedMacroSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMacroSlot[]): Map<string, string[]> {
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

export function defaultBatchedMacroSlotValidator(): BatchedMacroSlotValidator {
  return new BatchedMacroSlotValidator(
    [
      new BatchedMacroSlotRequiredNotesRule("batched macro slot needs this field"),
      new BatchedMacroSlotCampaignRefLengthRule(32),
      new BatchedMacroSlotRequiredCampaignRefRule("batched macro slot needs a value"),
      new BatchedMacroSlotNameLengthRule(3600),
      new BatchedMacroSlotRequiredNameRule("batched macro slot needs a value"),
    ],
  );
}

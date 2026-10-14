import { CappedSlaCheckpoint } from "./capped-sla-checkpoint.js";

/** A rule a capped sla checkpoint must pass. Check returns its problems, or none. */
export interface CappedSlaCheckpointRule {
  check(item: CappedSlaCheckpoint): string[];
}

export class CappedSlaCheckpointRequiredTitleRule implements CappedSlaCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSlaCheckpointCodePrefixRule implements CappedSlaCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSlaCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSlaCheckpointRequiredLocaleRule implements CappedSlaCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaCheckpoint): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CappedSlaCheckpointRequiredVariantRule implements CappedSlaCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaCheckpoint): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped sla checkpoint. */
export class CappedSlaCheckpointValidator {
  rules: CappedSlaCheckpointRule[];

  constructor(rules: CappedSlaCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSlaCheckpoint): string[] {
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

  requireValid(item: CappedSlaCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSlaCheckpoint[]): Map<string, string[]> {
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

export function defaultCappedSlaCheckpointValidator(): CappedSlaCheckpointValidator {
  return new CappedSlaCheckpointValidator(
    [
      new CappedSlaCheckpointRequiredTitleRule("capped sla checkpoint needs a value"),
      new CappedSlaCheckpointCodePrefixRule("OPS"),
      new CappedSlaCheckpointRequiredLocaleRule("capped sla checkpoint needs a value"),
      new CappedSlaCheckpointRequiredVariantRule("capped sla checkpoint needs this field"),
    ],
  );
}

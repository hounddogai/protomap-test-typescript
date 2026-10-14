import { TierCheckpoint } from "./tier-checkpoint.js";

/** A rule a tier checkpoint must pass. Check returns its problems, or none. */
export interface TierCheckpointRule {
  check(item: TierCheckpoint): string[];
}

export class TierCheckpointRequiredTimezoneRule implements TierCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierCheckpoint): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class TierCheckpointRequiredCodeRule implements TierCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TierCheckpointTagsLimitRule implements TierCheckpointRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TierCheckpoint): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class TierCheckpointRequiredNameRule implements TierCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierCheckpointCapacityRangeRule implements TierCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierCheckpoint): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tier checkpoint. */
export class TierCheckpointValidator {
  rules: TierCheckpointRule[];

  constructor(rules: TierCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TierCheckpoint): string[] {
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

  requireValid(item: TierCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierCheckpoint[]): Map<string, string[]> {
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

export function defaultTierCheckpointValidator(): TierCheckpointValidator {
  return new TierCheckpointValidator(
    [
      new TierCheckpointRequiredTimezoneRule("tier checkpoint needs an entry"),
      new TierCheckpointRequiredCodeRule("tier checkpoint needs an entry"),
      new TierCheckpointTagsLimitRule(255, ["pending"]),
      new TierCheckpointRequiredNameRule("tier checkpoint needs this field"),
      new TierCheckpointCapacityRangeRule(80, 3600),
    ],
  );
}

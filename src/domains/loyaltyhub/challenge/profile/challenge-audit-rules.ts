import { ChallengeAudit } from "./challenge-audit.js";

/** A rule a challenge audit must pass. Check returns its problems, or none. */
export interface ChallengeAuditRule {
  check(item: ChallengeAudit): string[];
}

export class ChallengeAuditRatioRangeRule implements ChallengeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeAudit): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeAuditWeightRangeRule implements ChallengeAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeAudit): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeAuditNameLengthRule implements ChallengeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeAudit): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeAuditChannelLengthRule implements ChallengeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeAuditChecksumLengthRule implements ChallengeAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeAudit): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge audit. */
export class ChallengeAuditValidator {
  rules: ChallengeAuditRule[];

  constructor(rules: ChallengeAuditRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeAudit): string[] {
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

  requireValid(item: ChallengeAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeAudit[]): Map<string, string[]> {
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

export function defaultChallengeAuditValidator(): ChallengeAuditValidator {
  return new ChallengeAuditValidator(
    [
      new ChallengeAuditRatioRangeRule(9.9, 1098.8),
      new ChallengeAuditWeightRangeRule(8.2, 2223.5),
      new ChallengeAuditNameLengthRule(80),
      new ChallengeAuditChannelLengthRule(255),
      new ChallengeAuditChecksumLengthRule(1000),
    ],
  );
}

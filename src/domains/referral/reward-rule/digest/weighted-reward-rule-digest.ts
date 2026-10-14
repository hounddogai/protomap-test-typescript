import * as text from "../../../../kit/text.js";

/** Where a weighted reward rule digest is in its life cycle. */
export type WeightedRewardRuleDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a weighted reward rule digest and its current status. */
export class WeightedRewardRuleDigest {
  code: string;
  name: string;
  locale: string;
  version: number;
  cost: number;
  revision: number;
  minimum: number;
  updatedAt: number;
  checksum: string;
  status: WeightedRewardRuleDigestStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    version: number,
    cost: number,
    revision: number,
    minimum: number,
    updatedAt: number,
    checksum: string,
    status: WeightedRewardRuleDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.version = version;
    this.cost = cost;
    this.revision = revision;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedRewardRuleDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedRewardRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.minimum * this.cost * 100) / 100;
  }

  copy(): WeightedRewardRuleDigest {
    return new WeightedRewardRuleDigest(
      this.code,
      this.name,
      this.locale,
      this.version,
      this.cost,
      this.revision,
      this.minimum,
      this.updatedAt,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted reward rule digest in status open. */
export function newWeightedRewardRuleDigest(code: string, name: string): WeightedRewardRuleDigest {
  return new WeightedRewardRuleDigest(code, name, "", 0, 0, 0, 0, 0, "", "open");
}

import * as text from "../../../../kit/text.js";

/** Where a reward rule agreement is in its life cycle. */
export type RewardRuleAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a reward rule agreement and its current status. */
export class RewardRuleAgreement {
  code: string;
  name: string;
  tags: string[];
  region: string;
  source: string;
  ownerId: string;
  capacity: number;
  journeyId: string;
  updatedAt: number;
  status: RewardRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    region: string,
    source: string,
    ownerId: string,
    capacity: number,
    journeyId: string,
    updatedAt: number,
    status: RewardRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.region = region;
    this.source = source;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reward rule agreement"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.updatedAt * this.capacity * 100) / 100;
  }

  copy(): RewardRuleAgreement {
    return new RewardRuleAgreement(
      this.code,
      this.name,
      this.tags,
      this.region,
      this.source,
      this.ownerId,
      this.capacity,
      this.journeyId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward rule agreement in status draft. */
export function newRewardRuleAgreement(code: string, name: string): RewardRuleAgreement {
  return new RewardRuleAgreement(code, name, [], "", "", "", 0, "", 0, "draft");
}

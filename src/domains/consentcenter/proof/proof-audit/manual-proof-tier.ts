import * as text from "../../../../kit/text.js";

/** Where a manual proof tier is in its life cycle. */
export type ManualProofTierStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual proof tier as the proof team keeps it. */
export class ManualProofTier {
  code: string;
  title: string;
  amount: number;
  batchSize: number;
  channel: string;
  budget: number;
  conversionRate: number;
  startsAt: number;
  tags: string[];
  score: number;
  status: ManualProofTierStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    batchSize: number,
    channel: string,
    budget: number,
    conversionRate: number,
    startsAt: number,
    tags: string[],
    score: number,
    status: ManualProofTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.batchSize = batchSize;
    this.channel = channel;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.tags = tags;
    this.score = score;
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

  canMoveTo(next: ManualProofTierStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: ManualProofTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual proof tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt + this.amount) * 100) / 100;
  }

  copy(): ManualProofTier {
    return new ManualProofTier(
      this.code,
      this.title,
      this.amount,
      this.batchSize,
      this.channel,
      this.budget,
      this.conversionRate,
      this.startsAt,
      this.tags,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual proof tier in status draft. */
export function newManualProofTier(code: string, title: string): ManualProofTier {
  return new ManualProofTier(code, title, 0, 0, "", 0, 0, 0, [], 0, "draft");
}

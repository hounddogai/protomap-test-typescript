import * as text from "../../../../kit/text.js";

/** Where a primary warmup tier is in its life cycle. */
export type PrimaryWarmupTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary warmup tier. Its code is unique within a tenant. */
export class PrimaryWarmupTier {
  code: string;
  label: string;
  budget: number;
  channel: string;
  tags: string[];
  active: boolean;
  bid: number;
  expiresAt: number;
  title: string;
  status: PrimaryWarmupTierStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    channel: string,
    tags: string[],
    active: boolean,
    bid: number,
    expiresAt: number,
    title: string,
    status: PrimaryWarmupTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.channel = channel;
    this.tags = tags;
    this.active = active;
    this.bid = bid;
    this.expiresAt = expiresAt;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryWarmupTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryWarmupTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary warmup tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.expiresAt * this.budget * 100) / 100;
  }

  copy(): PrimaryWarmupTier {
    return new PrimaryWarmupTier(
      this.code,
      this.label,
      this.budget,
      this.channel,
      this.tags,
      this.active,
      this.bid,
      this.expiresAt,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary warmup tier in status proposed. */
export function newPrimaryWarmupTier(code: string, label: string): PrimaryWarmupTier {
  return new PrimaryWarmupTier(code, label, 0, "", [], false, 0, 0, "", "proposed");
}

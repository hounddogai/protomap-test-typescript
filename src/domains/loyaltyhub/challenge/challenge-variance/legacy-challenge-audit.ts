import * as text from "../../../../kit/text.js";

/** Where a legacy challenge audit is in its life cycle. */
export type LegacyChallengeAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy challenge audit. Its code is unique within a tenant. */
export class LegacyChallengeAudit {
  code: string;
  title: string;
  expiresAt: number;
  name: string;
  windowDays: number;
  budget: number;
  region: string;
  impressions: number;
  amount: number;
  status: LegacyChallengeAuditStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    name: string,
    windowDays: number,
    budget: number,
    region: string,
    impressions: number,
    amount: number,
    status: LegacyChallengeAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.name = name;
    this.windowDays = windowDays;
    this.budget = budget;
    this.region = region;
    this.impressions = impressions;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyChallengeAuditStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyChallengeAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.expiresAt * this.windowDays * 100) / 100;
  }

  copy(): LegacyChallengeAudit {
    return new LegacyChallengeAudit(
      this.code,
      this.title,
      this.expiresAt,
      this.name,
      this.windowDays,
      this.budget,
      this.region,
      this.impressions,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy challenge audit in status new. */
export function newLegacyChallengeAudit(code: string, title: string): LegacyChallengeAudit {
  return new LegacyChallengeAudit(code, title, 0, "", 0, 0, "", 0, 0, "new");
}

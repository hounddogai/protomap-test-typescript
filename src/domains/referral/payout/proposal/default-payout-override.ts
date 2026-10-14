import * as text from "../../../../kit/text.js";

/** Where a default payout override is in its life cycle. */
export type DefaultPayoutOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default payout override as the payout team keeps it. */
export class DefaultPayoutOverride {
  code: string;
  title: string;
  audienceId: string;
  createdAt: number;
  campaignRef: string;
  limit: number;
  durationMinutes: number;
  status: DefaultPayoutOverrideStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    createdAt: number,
    campaignRef: string,
    limit: number,
    durationMinutes: number,
    status: DefaultPayoutOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.limit = limit;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: DefaultPayoutOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultPayoutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default payout override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.durationMinutes - this.createdAt) * 100) / 100;
  }

  copy(): DefaultPayoutOverride {
    return new DefaultPayoutOverride(
      this.code,
      this.title,
      this.audienceId,
      this.createdAt,
      this.campaignRef,
      this.limit,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default payout override in status draft. */
export function newDefaultPayoutOverride(code: string, title: string): DefaultPayoutOverride {
  return new DefaultPayoutOverride(code, title, "", 0, "", 0, 0, "draft");
}

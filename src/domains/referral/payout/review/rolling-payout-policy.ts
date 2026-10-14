import * as text from "../../../../kit/text.js";

/** Where a rolling payout policy is in its life cycle. */
export type RollingPayoutPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling payout policy. Its code is unique within a tenant. */
export class RollingPayoutPolicy {
  code: string;
  title: string;
  updatedAt: number;
  createdAt: number;
  utmSource: string;
  approved: boolean;
  notes: string;
  tags: string[];
  channel: string;
  journeyId: string;
  status: RollingPayoutPolicyStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    createdAt: number,
    utmSource: string,
    approved: boolean,
    notes: string,
    tags: string[],
    channel: string,
    journeyId: string,
    status: RollingPayoutPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.utmSource = utmSource;
    this.approved = approved;
    this.notes = notes;
    this.tags = tags;
    this.channel = channel;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPayoutPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPayoutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling payout policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt - this.createdAt) * 100) / 100;
  }

  copy(): RollingPayoutPolicy {
    return new RollingPayoutPolicy(
      this.code,
      this.title,
      this.updatedAt,
      this.createdAt,
      this.utmSource,
      this.approved,
      this.notes,
      this.tags,
      this.channel,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling payout policy in status planned. */
export function newRollingPayoutPolicy(code: string, title: string): RollingPayoutPolicy {
  return new RollingPayoutPolicy(code, title, 0, 0, "", false, "", [], "", "", "planned");
}

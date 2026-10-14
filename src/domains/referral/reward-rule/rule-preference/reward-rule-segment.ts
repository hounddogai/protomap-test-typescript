import * as text from "../../../../kit/text.js";

/** Where a reward rule segment is in its life cycle. */
export type RewardRuleSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a reward rule segment and its current status. */
export class RewardRuleSegment {
  code: string;
  name: string;
  channel: string;
  contactEmail: string;
  source: string;
  active: boolean;
  frequencyCap: number;
  graceDays: number;
  clicks: number;
  ratio: number;
  capacity: number;
  status: RewardRuleSegmentStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    contactEmail: string,
    source: string,
    active: boolean,
    frequencyCap: number,
    graceDays: number,
    clicks: number,
    ratio: number,
    capacity: number,
    status: RewardRuleSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.source = source;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.ratio = ratio;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule segment"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.capacity - this.ratio) * 100) / 100;
  }

  copy(): RewardRuleSegment {
    return new RewardRuleSegment(
      this.code,
      this.name,
      this.channel,
      this.contactEmail,
      this.source,
      this.active,
      this.frequencyCap,
      this.graceDays,
      this.clicks,
      this.ratio,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward rule segment in status requested. */
export function newRewardRuleSegment(code: string, name: string): RewardRuleSegment {
  return new RewardRuleSegment(code, name, "", "", "", false, 0, 0, 0, 0, 0, "requested");
}

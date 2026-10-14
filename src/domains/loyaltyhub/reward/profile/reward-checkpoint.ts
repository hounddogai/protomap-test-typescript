import * as text from "../../../../kit/text.js";

/** Where a reward checkpoint is in its life cycle. */
export type RewardCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reward checkpoint. Its code is unique within a tenant. */
export class RewardCheckpoint {
  code: string;
  name: string;
  endsAt: number;
  campaignRef: string;
  journeyId: string;
  checksum: string;
  country: string;
  locale: string;
  status: RewardCheckpointStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    campaignRef: string,
    journeyId: string,
    checksum: string,
    country: string,
    locale: string,
    status: RewardCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.checksum = checksum;
    this.country = country;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RewardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"reward checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): RewardCheckpoint {
    return new RewardCheckpoint(
      this.code,
      this.name,
      this.endsAt,
      this.campaignRef,
      this.journeyId,
      this.checksum,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reward checkpoint in status idle. */
export function newRewardCheckpoint(code: string, name: string): RewardCheckpoint {
  return new RewardCheckpoint(code, name, 0, "", "", "", "", "", "idle");
}

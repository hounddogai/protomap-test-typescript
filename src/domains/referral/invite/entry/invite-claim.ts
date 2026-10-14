import * as text from "../../../../kit/text.js";

/** Where a invite claim is in its life cycle. */
export type InviteClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One invite claim, with what the planners need to act on it. */
export class InviteClaim {
  code: string;
  name: string;
  graceDays: number;
  reviewer: string;
  endsAt: number;
  bid: number;
  timezone: string;
  archived: boolean;
  audienceId: string;
  ownerId: string;
  status: InviteClaimStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    reviewer: string,
    endsAt: number,
    bid: number,
    timezone: string,
    archived: boolean,
    audienceId: string,
    ownerId: string,
    status: InviteClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.bid = bid;
    this.timezone = timezone;
    this.archived = archived;
    this.audienceId = audienceId;
    this.ownerId = ownerId;
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

  canMoveTo(next: InviteClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: InviteClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.graceDays + this.bid) * 100) / 100;
  }

  copy(): InviteClaim {
    return new InviteClaim(
      this.code,
      this.name,
      this.graceDays,
      this.reviewer,
      this.endsAt,
      this.bid,
      this.timezone,
      this.archived,
      this.audienceId,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite claim in status idle. */
export function newInviteClaim(code: string, name: string): InviteClaim {
  return new InviteClaim(code, name, 0, "", 0, 0, "", false, "", "", "idle");
}

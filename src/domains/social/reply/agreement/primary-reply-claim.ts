import * as text from "../../../../kit/text.js";

/** Where a primary reply claim is in its life cycle. */
export type PrimaryReplyClaimStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary reply claim as the reply team keeps it. */
export class PrimaryReplyClaim {
  code: string;
  title: string;
  quantity: number;
  clicks: number;
  sequence: number;
  startsAt: number;
  ownerId: string;
  endsAt: number;
  durationMinutes: number;
  summary: string;
  status: PrimaryReplyClaimStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    clicks: number,
    sequence: number,
    startsAt: number,
    ownerId: string,
    endsAt: number,
    durationMinutes: number,
    summary: string,
    status: PrimaryReplyClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.clicks = clicks;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.endsAt = endsAt;
    this.durationMinutes = durationMinutes;
    this.summary = summary;
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

  canMoveTo(next: PrimaryReplyClaimStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryReplyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reply claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.clicks - this.endsAt) * 100) / 100;
  }

  copy(): PrimaryReplyClaim {
    return new PrimaryReplyClaim(
      this.code,
      this.title,
      this.quantity,
      this.clicks,
      this.sequence,
      this.startsAt,
      this.ownerId,
      this.endsAt,
      this.durationMinutes,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary reply claim in status new. */
export function newPrimaryReplyClaim(code: string, title: string): PrimaryReplyClaim {
  return new PrimaryReplyClaim(code, title, 0, 0, 0, 0, "", 0, 0, "", "new");
}

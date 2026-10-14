import * as text from "../../../../kit/text.js";

/** Where a redemption draft is in its life cycle. */
export type RedemptionDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A redemption draft. Its code is unique within a tenant. */
export class RedemptionDraft {
  code: string;
  name: string;
  variant: string;
  sendAt: number;
  quantity: number;
  updatedAt: number;
  journeyId: string;
  score: number;
  title: string;
  sequence: number;
  pinned: boolean;
  status: RedemptionDraftStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    sendAt: number,
    quantity: number,
    updatedAt: number,
    journeyId: string,
    score: number,
    title: string,
    sequence: number,
    pinned: boolean,
    status: RedemptionDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.sendAt = sendAt;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
    this.score = score;
    this.title = title;
    this.sequence = sequence;
    this.pinned = pinned;
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

  canMoveTo(next: RedemptionDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RedemptionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity - this.sendAt) * 100) / 100;
  }

  copy(): RedemptionDraft {
    return new RedemptionDraft(
      this.code,
      this.name,
      this.variant,
      this.sendAt,
      this.quantity,
      this.updatedAt,
      this.journeyId,
      this.score,
      this.title,
      this.sequence,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a redemption draft in status idle. */
export function newRedemptionDraft(code: string, name: string): RedemptionDraft {
  return new RedemptionDraft(code, name, "", 0, 0, 0, "", 0, "", 0, false, "idle");
}

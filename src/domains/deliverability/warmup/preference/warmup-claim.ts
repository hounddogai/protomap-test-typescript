import * as text from "../../../../kit/text.js";

/** Where a warmup claim is in its life cycle. */
export type WarmupClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a warmup claim and its current status. */
export class WarmupClaim {
  code: string;
  title: string;
  audienceId: string;
  approved: boolean;
  name: string;
  threshold: number;
  minimum: number;
  endsAt: number;
  externalRef: string;
  sendAt: number;
  status: WarmupClaimStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    approved: boolean,
    name: string,
    threshold: number,
    minimum: number,
    endsAt: number,
    externalRef: string,
    sendAt: number,
    status: WarmupClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.approved = approved;
    this.name = name;
    this.threshold = threshold;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.sendAt = sendAt;
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

  canMoveTo(next: WarmupClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
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

  moveTo(next: WarmupClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.minimum + this.threshold) * 100) / 100;
  }

  copy(): WarmupClaim {
    return new WarmupClaim(
      this.code,
      this.title,
      this.audienceId,
      this.approved,
      this.name,
      this.threshold,
      this.minimum,
      this.endsAt,
      this.externalRef,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup claim in status idle. */
export function newWarmupClaim(code: string, title: string): WarmupClaim {
  return new WarmupClaim(code, title, "", false, "", 0, 0, 0, "", 0, "idle");
}

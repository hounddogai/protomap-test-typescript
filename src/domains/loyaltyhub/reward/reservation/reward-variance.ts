import * as text from "../../../../kit/text.js";

/** Where a reward variance is in its life cycle. */
export type RewardVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** One reward variance, with what the planners need to act on it. */
export class RewardVariance {
  code: string;
  label: string;
  audienceId: string;
  pinned: boolean;
  ownerId: string;
  source: string;
  quantity: number;
  status: RewardVarianceStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    pinned: boolean,
    ownerId: string,
    source: string,
    quantity: number,
    status: RewardVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.source = source;
    this.quantity = quantity;
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

  canMoveTo(next: RewardVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): RewardVariance {
    return new RewardVariance(
      this.code,
      this.label,
      this.audienceId,
      this.pinned,
      this.ownerId,
      this.source,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward variance in status requested. */
export function newRewardVariance(code: string, label: string): RewardVariance {
  return new RewardVariance(code, label, "", false, "", "", 0, "requested");
}

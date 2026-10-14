import * as text from "../../../../kit/text.js";

/** Where a reward rule checkpoint is in its life cycle. */
export type RewardRuleCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a reward rule checkpoint and its current status. */
export class RewardRuleCheckpoint {
  code: string;
  name: string;
  pinned: boolean;
  ownerId: string;
  priority: number;
  endsAt: number;
  timezone: string;
  quantity: number;
  updatedAt: number;
  ratio: number;
  status: RewardRuleCheckpointStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    ownerId: string,
    priority: number,
    endsAt: number,
    timezone: string,
    quantity: number,
    updatedAt: number,
    ratio: number,
    status: RewardRuleCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.priority = priority;
    this.endsAt = endsAt;
    this.timezone = timezone;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.ratio = ratio;
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

  canMoveTo(next: RewardRuleCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.endsAt - this.quantity) * 100) / 100;
  }

  copy(): RewardRuleCheckpoint {
    return new RewardRuleCheckpoint(
      this.code,
      this.name,
      this.pinned,
      this.ownerId,
      this.priority,
      this.endsAt,
      this.timezone,
      this.quantity,
      this.updatedAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule checkpoint in status idle. */
export function newRewardRuleCheckpoint(code: string, name: string): RewardRuleCheckpoint {
  return new RewardRuleCheckpoint(code, name, false, "", 0, 0, "", 0, 0, 0, "idle");
}

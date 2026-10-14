import * as text from "../../../../kit/text.js";

/** Where a global retention plan is in its life cycle. */
export type GlobalRetentionPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A global retention plan as the retention team keeps it. */
export class GlobalRetentionPlan {
  code: string;
  name: string;
  capacity: number;
  channel: string;
  score: number;
  sendAt: number;
  status: GlobalRetentionPlanStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    channel: string,
    score: number,
    sendAt: number,
    status: GlobalRetentionPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.channel = channel;
    this.score = score;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRetentionPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRetentionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.score + this.sendAt) * 100) / 100;
  }

  copy(): GlobalRetentionPlan {
    return new GlobalRetentionPlan(
      this.code,
      this.name,
      this.capacity,
      this.channel,
      this.score,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global retention plan in status proposed. */
export function newGlobalRetentionPlan(code: string, name: string): GlobalRetentionPlan {
  return new GlobalRetentionPlan(code, name, 0, "", 0, 0, "proposed");
}

import * as text from "../../../../kit/text.js";

/** Where a global touchpoint plan is in its life cycle. */
export type GlobalTouchpointPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A global touchpoint plan as the touchpoint team keeps it. */
export class GlobalTouchpointPlan {
  code: string;
  name: string;
  minimum: number;
  windowDays: number;
  batchSize: number;
  audienceId: string;
  priority: number;
  status: GlobalTouchpointPlanStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    windowDays: number,
    batchSize: number,
    audienceId: string,
    priority: number,
    status: GlobalTouchpointPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.priority = priority;
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

  canMoveTo(next: GlobalTouchpointPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalTouchpointPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global touchpoint plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round((this.minimum - this.priority) * 100) / 100;
  }

  copy(): GlobalTouchpointPlan {
    return new GlobalTouchpointPlan(
      this.code,
      this.name,
      this.minimum,
      this.windowDays,
      this.batchSize,
      this.audienceId,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global touchpoint plan in status requested. */
export function newGlobalTouchpointPlan(code: string, name: string): GlobalTouchpointPlan {
  return new GlobalTouchpointPlan(code, name, 0, 0, 0, "", 0, "requested");
}

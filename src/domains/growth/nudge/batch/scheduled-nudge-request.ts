import * as text from "../../../../kit/text.js";

/** Where a scheduled nudge request is in its life cycle. */
export type ScheduledNudgeRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled nudge request. Its code is unique within a tenant. */
export class ScheduledNudgeRequest {
  code: string;
  name: string;
  active: boolean;
  unit: string;
  externalRef: string;
  createdAt: number;
  limit: number;
  sequence: number;
  sendAt: number;
  retries: number;
  status: ScheduledNudgeRequestStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    unit: string,
    externalRef: string,
    createdAt: number,
    limit: number,
    sequence: number,
    sendAt: number,
    retries: number,
    status: ScheduledNudgeRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.unit = unit;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
    this.limit = limit;
    this.sequence = sequence;
    this.sendAt = sendAt;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledNudgeRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledNudgeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled nudge request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.createdAt + this.retries) * 100) / 100;
  }

  copy(): ScheduledNudgeRequest {
    return new ScheduledNudgeRequest(
      this.code,
      this.name,
      this.active,
      this.unit,
      this.externalRef,
      this.createdAt,
      this.limit,
      this.sequence,
      this.sendAt,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled nudge request in status draft. */
export function newScheduledNudgeRequest(code: string, name: string): ScheduledNudgeRequest {
  return new ScheduledNudgeRequest(code, name, false, "", "", 0, 0, 0, 0, 0, "draft");
}

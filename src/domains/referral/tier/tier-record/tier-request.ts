import * as text from "../../../../kit/text.js";

/** Where a tier request is in its life cycle. */
export type TierRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tier request. Its code is unique within a tenant. */
export class TierRequest {
  code: string;
  name: string;
  batchSize: number;
  reviewer: string;
  threshold: number;
  durationMinutes: number;
  visible: boolean;
  channel: string;
  contactEmail: string;
  cohort: string;
  weight: number;
  status: TierRequestStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    reviewer: string,
    threshold: number,
    durationMinutes: number,
    visible: boolean,
    channel: string,
    contactEmail: string,
    cohort: string,
    weight: number,
    status: TierRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.threshold = threshold;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.weight = weight;
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

  canMoveTo(next: TierRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
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

  moveTo(next: TierRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.batchSize - this.weight) * 100) / 100;
  }

  copy(): TierRequest {
    return new TierRequest(
      this.code,
      this.name,
      this.batchSize,
      this.reviewer,
      this.threshold,
      this.durationMinutes,
      this.visible,
      this.channel,
      this.contactEmail,
      this.cohort,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tier request in status idle. */
export function newTierRequest(code: string, name: string): TierRequest {
  return new TierRequest(code, name, 0, "", 0, 0, false, "", "", "", 0, "idle");
}

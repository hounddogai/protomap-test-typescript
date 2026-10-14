import * as text from "../../../../kit/text.js";

/** Where a step variance is in its life cycle. */
export type StepVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A step variance. Its code is unique within a tenant. */
export class StepVariance {
  code: string;
  name: string;
  createdAt: number;
  pinned: boolean;
  endsAt: number;
  audienceId: string;
  sequence: number;
  capacity: number;
  impressions: number;
  bid: number;
  status: StepVarianceStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    pinned: boolean,
    endsAt: number,
    audienceId: string,
    sequence: number,
    capacity: number,
    impressions: number,
    bid: number,
    status: StepVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.capacity = capacity;
    this.impressions = impressions;
    this.bid = bid;
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

  canMoveTo(next: StepVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"step variance"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions - this.createdAt) * 100) / 100;
  }

  copy(): StepVariance {
    return new StepVariance(
      this.code,
      this.name,
      this.createdAt,
      this.pinned,
      this.endsAt,
      this.audienceId,
      this.sequence,
      this.capacity,
      this.impressions,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a step variance in status requested. */
export function newStepVariance(code: string, name: string): StepVariance {
  return new StepVariance(code, name, 0, false, 0, "", 0, 0, 0, 0, "requested");
}

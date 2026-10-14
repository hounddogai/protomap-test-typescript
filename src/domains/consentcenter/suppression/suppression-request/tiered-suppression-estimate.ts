import * as text from "../../../../kit/text.js";

/** Where a tiered suppression estimate is in its life cycle. */
export type TieredSuppressionEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered suppression estimate, with what the planners need to act on it. */
export class TieredSuppressionEstimate {
  code: string;
  name: string;
  score: number;
  country: string;
  phone: string;
  capacity: number;
  sendAt: number;
  channel: string;
  status: TieredSuppressionEstimateStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    country: string,
    phone: string,
    capacity: number,
    sendAt: number,
    channel: string,
    status: TieredSuppressionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.country = country;
    this.phone = phone;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.channel = channel;
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

  canMoveTo(next: TieredSuppressionEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSuppressionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered suppression estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered suppression estimate"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.sendAt + this.score) * 100) / 100;
  }

  copy(): TieredSuppressionEstimate {
    return new TieredSuppressionEstimate(
      this.code,
      this.name,
      this.score,
      this.country,
      this.phone,
      this.capacity,
      this.sendAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered suppression estimate in status idle. */
export function newTieredSuppressionEstimate(code: string, name: string): TieredSuppressionEstimate {
  return new TieredSuppressionEstimate(code, name, 0, "", "", 0, 0, "", "idle");
}

import * as text from "../../../../kit/text.js";

/** Where a weighted touchpoint notice is in its life cycle. */
export type WeightedTouchpointNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted touchpoint notice as the touchpoint team keeps it. */
export class WeightedTouchpointNotice {
  code: string;
  name: string;
  retries: number;
  floorValue: number;
  discount: number;
  channel: string;
  rate: number;
  status: WeightedTouchpointNoticeStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    floorValue: number,
    discount: number,
    channel: string,
    rate: number,
    status: WeightedTouchpointNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.floorValue = floorValue;
    this.discount = discount;
    this.channel = channel;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTouchpointNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTouchpointNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted touchpoint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.floorValue * this.rate * 100) / 100;
  }

  copy(): WeightedTouchpointNotice {
    return new WeightedTouchpointNotice(
      this.code,
      this.name,
      this.retries,
      this.floorValue,
      this.discount,
      this.channel,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted touchpoint notice in status open. */
export function newWeightedTouchpointNotice(code: string, name: string): WeightedTouchpointNotice {
  return new WeightedTouchpointNotice(code, name, 0, 0, 0, "", 0, "open");
}

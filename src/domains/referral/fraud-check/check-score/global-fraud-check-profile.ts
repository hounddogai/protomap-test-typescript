import * as text from "../../../../kit/text.js";

/** Where a global fraud check profile is in its life cycle. */
export type GlobalFraudCheckProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global fraud check profile, with what the planners need to act on it. */
export class GlobalFraudCheckProfile {
  code: string;
  label: string;
  sendAt: number;
  clicks: number;
  bid: number;
  retries: number;
  summary: string;
  active: boolean;
  weight: number;
  cost: number;
  status: GlobalFraudCheckProfileStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    clicks: number,
    bid: number,
    retries: number,
    summary: string,
    active: boolean,
    weight: number,
    cost: number,
    status: GlobalFraudCheckProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.bid = bid;
    this.retries = retries;
    this.summary = summary;
    this.active = active;
    this.weight = weight;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFraudCheckProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFraudCheckProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global fraud check profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.cost + this.bid) * 100) / 100;
  }

  copy(): GlobalFraudCheckProfile {
    return new GlobalFraudCheckProfile(
      this.code,
      this.label,
      this.sendAt,
      this.clicks,
      this.bid,
      this.retries,
      this.summary,
      this.active,
      this.weight,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global fraud check profile in status new. */
export function newGlobalFraudCheckProfile(code: string, label: string): GlobalFraudCheckProfile {
  return new GlobalFraudCheckProfile(code, label, 0, 0, 0, 0, "", false, 0, 0, "new");
}

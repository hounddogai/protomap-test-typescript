/**
 * The nudge summary records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge summary is in its life cycle. */
export type NudgeSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A nudge summary. Its code is unique within a tenant. */
export class NudgeSummary {
  code: string;
  name: string;
  quantity: number;
  campaignRef: string;
  ownerId: string;
  sendAt: number;
  archived: boolean;
  version: number;
  rate: number;
  clicks: number;
  status: NudgeSummaryStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    campaignRef: string,
    ownerId: string,
    sendAt: number,
    archived: boolean,
    version: number,
    rate: number,
    clicks: number,
    status: NudgeSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.sendAt = sendAt;
    this.archived = archived;
    this.version = version;
    this.rate = rate;
    this.clicks = clicks;
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

  canMoveTo(next: NudgeSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: NudgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"nudge summary"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.rate * this.version * 100) / 100;
  }

  copy(): NudgeSummary {
    return new NudgeSummary(
      this.code,
      this.name,
      this.quantity,
      this.campaignRef,
      this.ownerId,
      this.sendAt,
      this.archived,
      this.version,
      this.rate,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a nudge summary in status draft. */
export function newNudgeSummary(code: string, name: string): NudgeSummary {
  return new NudgeSummary(code, name, 0, "", "", 0, false, 0, 0, 0, "draft");
}

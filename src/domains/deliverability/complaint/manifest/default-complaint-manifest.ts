/**
 * The default complaint manifest records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default complaint manifest is in its life cycle. */
export type DefaultComplaintManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default complaint manifest. Its code is unique within a tenant. */
export class DefaultComplaintManifest {
  code: string;
  title: string;
  summary: string;
  bid: number;
  updatedAt: number;
  campaignRef: string;
  notes: string;
  cost: number;
  timezone: string;
  endsAt: number;
  status: DefaultComplaintManifestStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    bid: number,
    updatedAt: number,
    campaignRef: string,
    notes: string,
    cost: number,
    timezone: string,
    endsAt: number,
    status: DefaultComplaintManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.bid = bid;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.cost = cost;
    this.timezone = timezone;
    this.endsAt = endsAt;
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

  canMoveTo(next: DefaultComplaintManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultComplaintManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default complaint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round(this.endsAt * this.cost * 100) / 100;
  }

  copy(): DefaultComplaintManifest {
    return new DefaultComplaintManifest(
      this.code,
      this.title,
      this.summary,
      this.bid,
      this.updatedAt,
      this.campaignRef,
      this.notes,
      this.cost,
      this.timezone,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default complaint manifest in status new. */
export function newDefaultComplaintManifest(code: string, title: string): DefaultComplaintManifest {
  return new DefaultComplaintManifest(code, title, "", 0, 0, "", "", 0, "", 0, "new");
}

/**
 * The reputation profile records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation profile is in its life cycle. */
export type ReputationProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation profile as the reputation team keeps it. */
export class ReputationProfile {
  code: string;
  label: string;
  region: string;
  contactEmail: string;
  channel: string;
  quantity: number;
  status: ReputationProfileStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    contactEmail: string,
    channel: string,
    quantity: number,
    status: ReputationProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.quantity = quantity;
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

  canMoveTo(next: ReputationProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReputationProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ReputationProfile {
    return new ReputationProfile(
      this.code,
      this.label,
      this.region,
      this.contactEmail,
      this.channel,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reputation profile in status new. */
export function newReputationProfile(code: string, label: string): ReputationProfile {
  return new ReputationProfile(code, label, "", "", "", 0, "new");
}

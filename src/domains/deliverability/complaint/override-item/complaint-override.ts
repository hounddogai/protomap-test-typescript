/**
 * The complaint override records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint override is in its life cycle. */
export type ComplaintOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A complaint override. Its code is unique within a tenant. */
export class ComplaintOverride {
  code: string;
  label: string;
  checksum: string;
  campaignRef: string;
  externalRef: string;
  visible: boolean;
  frequencyCap: number;
  score: number;
  clicks: number;
  endsAt: number;
  status: ComplaintOverrideStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    campaignRef: string,
    externalRef: string,
    visible: boolean,
    frequencyCap: number,
    score: number,
    clicks: number,
    endsAt: number,
    status: ComplaintOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.externalRef = externalRef;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.clicks = clicks;
    this.endsAt = endsAt;
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

  canMoveTo(next: ComplaintOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ComplaintOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"complaint override"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap - this.score) * 100) / 100;
  }

  copy(): ComplaintOverride {
    return new ComplaintOverride(
      this.code,
      this.label,
      this.checksum,
      this.campaignRef,
      this.externalRef,
      this.visible,
      this.frequencyCap,
      this.score,
      this.clicks,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint override in status idle. */
export function newComplaintOverride(code: string, label: string): ComplaintOverride {
  return new ComplaintOverride(code, label, "", "", "", false, 0, 0, 0, 0, "idle");
}

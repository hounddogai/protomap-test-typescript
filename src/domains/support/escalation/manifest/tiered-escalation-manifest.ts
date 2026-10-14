/**
 * The tiered escalation manifest records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered escalation manifest is in its life cycle. */
export type TieredEscalationManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a tiered escalation manifest and its current status. */
export class TieredEscalationManifest {
  code: string;
  label: string;
  floorValue: number;
  frequencyCap: number;
  bid: number;
  channel: string;
  weight: number;
  status: TieredEscalationManifestStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    frequencyCap: number,
    bid: number,
    channel: string,
    weight: number,
    status: TieredEscalationManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.channel = channel;
    this.weight = weight;
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

  canMoveTo(next: TieredEscalationManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredEscalationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered escalation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered escalation manifest"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.frequencyCap + this.weight) * 100) / 100;
  }

  copy(): TieredEscalationManifest {
    return new TieredEscalationManifest(
      this.code,
      this.label,
      this.floorValue,
      this.frequencyCap,
      this.bid,
      this.channel,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered escalation manifest in status draft. */
export function newTieredEscalationManifest(code: string, label: string): TieredEscalationManifest {
  return new TieredEscalationManifest(code, label, 0, 0, 0, "", 0, "draft");
}

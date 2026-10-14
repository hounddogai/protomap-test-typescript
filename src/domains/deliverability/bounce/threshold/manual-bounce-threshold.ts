/**
 * The manual bounce threshold records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual bounce threshold is in its life cycle. */
export type ManualBounceThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual bounce threshold as the bounce team keeps it. */
export class ManualBounceThreshold {
  code: string;
  name: string;
  revision: number;
  externalRef: string;
  conversionRate: number;
  maximum: number;
  status: ManualBounceThresholdStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    externalRef: string,
    conversionRate: number,
    maximum: number,
    status: ManualBounceThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
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

  canMoveTo(next: ManualBounceThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualBounceThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round((this.maximum - this.revision) * 100) / 100;
  }

  copy(): ManualBounceThreshold {
    return new ManualBounceThreshold(
      this.code,
      this.name,
      this.revision,
      this.externalRef,
      this.conversionRate,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual bounce threshold in status draft. */
export function newManualBounceThreshold(code: string, name: string): ManualBounceThreshold {
  return new ManualBounceThreshold(code, name, 0, "", 0, 0, "draft");
}

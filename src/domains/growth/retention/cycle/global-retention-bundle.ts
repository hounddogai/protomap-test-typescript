import * as text from "../../../../kit/text.js";

/** Where a global retention bundle is in its life cycle. */
export type GlobalRetentionBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global retention bundle. Its code is unique within a tenant. */
export class GlobalRetentionBundle {
  code: string;
  name: string;
  audienceId: string;
  weight: number;
  maximum: number;
  quantity: number;
  sequence: number;
  openRate: number;
  campaignRef: string;
  startsAt: number;
  status: GlobalRetentionBundleStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    weight: number,
    maximum: number,
    quantity: number,
    sequence: number,
    openRate: number,
    campaignRef: string,
    startsAt: number,
    status: GlobalRetentionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.weight = weight;
    this.maximum = maximum;
    this.quantity = quantity;
    this.sequence = sequence;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
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

  canMoveTo(next: GlobalRetentionBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalRetentionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): GlobalRetentionBundle {
    return new GlobalRetentionBundle(
      this.code,
      this.name,
      this.audienceId,
      this.weight,
      this.maximum,
      this.quantity,
      this.sequence,
      this.openRate,
      this.campaignRef,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global retention bundle in status idle. */
export function newGlobalRetentionBundle(code: string, name: string): GlobalRetentionBundle {
  return new GlobalRetentionBundle(code, name, "", 0, 0, 0, 0, 0, "", 0, "idle");
}

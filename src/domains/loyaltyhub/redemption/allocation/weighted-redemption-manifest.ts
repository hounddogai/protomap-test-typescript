import * as text from "../../../../kit/text.js";

/** Where a weighted redemption manifest is in its life cycle. */
export type WeightedRedemptionManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted redemption manifest. Its code is unique within a tenant. */
export class WeightedRedemptionManifest {
  code: string;
  label: string;
  pinned: boolean;
  description: string;
  ownerId: string;
  quantity: number;
  status: WeightedRedemptionManifestStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    description: string,
    ownerId: string,
    quantity: number,
    status: WeightedRedemptionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.description = description;
    this.ownerId = ownerId;
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

  canMoveTo(next: WeightedRedemptionManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedRedemptionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted redemption manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): WeightedRedemptionManifest {
    return new WeightedRedemptionManifest(
      this.code,
      this.label,
      this.pinned,
      this.description,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted redemption manifest in status new. */
export function newWeightedRedemptionManifest(code: string, label: string): WeightedRedemptionManifest {
  return new WeightedRedemptionManifest(code, label, false, "", "", 0, "new");
}

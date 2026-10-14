import * as text from "../../../../kit/text.js";

/** Where a weighted fraud check bundle is in its life cycle. */
export type WeightedFraudCheckBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted fraud check bundle as the fraud check team keeps it. */
export class WeightedFraudCheckBundle {
  code: string;
  label: string;
  attributes: Map<string, string>;
  cost: number;
  audienceId: string;
  updatedAt: number;
  status: WeightedFraudCheckBundleStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    cost: number,
    audienceId: string,
    updatedAt: number,
    status: WeightedFraudCheckBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.cost = cost;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedFraudCheckBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedFraudCheckBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted fraud check bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.updatedAt - this.cost) * 100) / 100;
  }

  copy(): WeightedFraudCheckBundle {
    return new WeightedFraudCheckBundle(
      this.code,
      this.label,
      this.attributes,
      this.cost,
      this.audienceId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted fraud check bundle in status requested. */
export function newWeightedFraudCheckBundle(code: string, label: string): WeightedFraudCheckBundle {
  return new WeightedFraudCheckBundle(code, label, new Map<string, string>(), 0, "", 0, "requested");
}

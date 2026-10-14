import * as text from "../../../../kit/text.js";

/** Where a wait estimate is in its life cycle. */
export type WaitEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A wait estimate as the wait team keeps it. */
export class WaitEstimate {
  code: string;
  name: string;
  pinned: boolean;
  approved: boolean;
  audienceId: string;
  impressions: number;
  budget: number;
  segment: string;
  phone: string;
  attributes: Map<string, string>;
  status: WaitEstimateStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    approved: boolean,
    audienceId: string,
    impressions: number,
    budget: number,
    segment: string,
    phone: string,
    attributes: Map<string, string>,
    status: WaitEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.approved = approved;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.budget = budget;
    this.segment = segment;
    this.phone = phone;
    this.attributes = attributes;
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

  canMoveTo(next: WaitEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions - this.budget) * 100) / 100;
  }

  copy(): WaitEstimate {
    return new WaitEstimate(
      this.code,
      this.name,
      this.pinned,
      this.approved,
      this.audienceId,
      this.impressions,
      this.budget,
      this.segment,
      this.phone,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a wait estimate in status requested. */
export function newWaitEstimate(code: string, name: string): WaitEstimate {
  return new WaitEstimate(code, name, false, false, "", 0, 0, "", "", new Map<string, string>(), "requested");
}

import * as text from "../../../../kit/text.js";

/** Where a manual pacing mapping is in its life cycle. */
export type ManualPacingMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual pacing mapping. Its code is unique within a tenant. */
export class ManualPacingMapping {
  code: string;
  label: string;
  quantity: number;
  name: string;
  reviewer: string;
  bid: number;
  approved: boolean;
  impressions: number;
  country: string;
  attributes: Map<string, string>;
  minimum: number;
  status: ManualPacingMappingStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    name: string,
    reviewer: string,
    bid: number,
    approved: boolean,
    impressions: number,
    country: string,
    attributes: Map<string, string>,
    minimum: number,
    status: ManualPacingMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.name = name;
    this.reviewer = reviewer;
    this.bid = bid;
    this.approved = approved;
    this.impressions = impressions;
    this.country = country;
    this.attributes = attributes;
    this.minimum = minimum;
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

  canMoveTo(next: ManualPacingMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPacingMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual pacing mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual pacing mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round(this.quantity * this.bid * 100) / 100;
  }

  copy(): ManualPacingMapping {
    return new ManualPacingMapping(
      this.code,
      this.label,
      this.quantity,
      this.name,
      this.reviewer,
      this.bid,
      this.approved,
      this.impressions,
      this.country,
      this.attributes,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a manual pacing mapping in status requested. */
export function newManualPacingMapping(code: string, label: string): ManualPacingMapping {
  return new ManualPacingMapping(code, label, 0, "", "", 0, false, 0, "", new Map<string, string>(), 0, "requested");
}

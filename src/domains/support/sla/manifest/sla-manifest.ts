/**
 * The sla manifest records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla manifest is in its life cycle. */
export type SlaManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sla manifest. Its code is unique within a tenant. */
export class SlaManifest {
  code: string;
  title: string;
  budget: number;
  version: number;
  limit: number;
  expiresAt: number;
  externalRef: string;
  floorValue: number;
  clicks: number;
  status: SlaManifestStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    version: number,
    limit: number,
    expiresAt: number,
    externalRef: string,
    floorValue: number,
    clicks: number,
    status: SlaManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.version = version;
    this.limit = limit;
    this.expiresAt = expiresAt;
    this.externalRef = externalRef;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.budget * this.expiresAt * 100) / 100;
  }

  copy(): SlaManifest {
    return new SlaManifest(
      this.code,
      this.title,
      this.budget,
      this.version,
      this.limit,
      this.expiresAt,
      this.externalRef,
      this.floorValue,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla manifest in status proposed. */
export function newSlaManifest(code: string, title: string): SlaManifest {
  return new SlaManifest(code, title, 0, 0, 0, 0, "", 0, 0, "proposed");
}

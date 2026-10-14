import * as text from "../../../../kit/text.js";

/** Where a manual funnel manifest is in its life cycle. */
export type ManualFunnelManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual funnel manifest. Its code is unique within a tenant. */
export class ManualFunnelManifest {
  code: string;
  name: string;
  limit: number;
  openRate: number;
  campaignRef: string;
  createdAt: number;
  capacity: number;
  category: string;
  endsAt: number;
  status: ManualFunnelManifestStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    openRate: number,
    campaignRef: string,
    createdAt: number,
    capacity: number,
    category: string,
    endsAt: number,
    status: ManualFunnelManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.category = category;
    this.endsAt = endsAt;
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

  canMoveTo(next: ManualFunnelManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualFunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual funnel manifest"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.openRate - this.limit) * 100) / 100;
  }

  copy(): ManualFunnelManifest {
    return new ManualFunnelManifest(
      this.code,
      this.name,
      this.limit,
      this.openRate,
      this.campaignRef,
      this.createdAt,
      this.capacity,
      this.category,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual funnel manifest in status requested. */
export function newManualFunnelManifest(code: string, name: string): ManualFunnelManifest {
  return new ManualFunnelManifest(code, name, 0, 0, "", 0, 0, "", 0, "requested");
}

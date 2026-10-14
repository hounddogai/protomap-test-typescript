import * as text from "../../../../kit/text.js";

/** Where a scheduled approval manifest is in its life cycle. */
export type ScheduledApprovalManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled approval manifest as the approval team keeps it. */
export class ScheduledApprovalManifest {
  code: string;
  name: string;
  attempts: number;
  title: string;
  endsAt: number;
  impressions: number;
  retries: number;
  bid: number;
  externalRef: string;
  region: string;
  phone: string;
  status: ScheduledApprovalManifestStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    title: string,
    endsAt: number,
    impressions: number,
    retries: number,
    bid: number,
    externalRef: string,
    region: string,
    phone: string,
    status: ScheduledApprovalManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.title = title;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.retries = retries;
    this.bid = bid;
    this.externalRef = externalRef;
    this.region = region;
    this.phone = phone;
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

  canMoveTo(next: ScheduledApprovalManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: ScheduledApprovalManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled approval manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled approval manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.impressions - this.endsAt) * 100) / 100;
  }

  copy(): ScheduledApprovalManifest {
    return new ScheduledApprovalManifest(
      this.code,
      this.name,
      this.attempts,
      this.title,
      this.endsAt,
      this.impressions,
      this.retries,
      this.bid,
      this.externalRef,
      this.region,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled approval manifest in status draft. */
export function newScheduledApprovalManifest(code: string, name: string): ScheduledApprovalManifest {
  return new ScheduledApprovalManifest(code, name, 0, "", 0, 0, 0, 0, "", "", "", "draft");
}

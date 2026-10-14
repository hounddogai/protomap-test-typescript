/**
 * The regional complaint manifest records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional complaint manifest is in its life cycle. */
export type RegionalComplaintManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional complaint manifest. Its code is unique within a tenant. */
export class RegionalComplaintManifest {
  code: string;
  label: string;
  expiresAt: number;
  createdAt: number;
  channel: string;
  margin: number;
  budget: number;
  utmSource: string;
  status: RegionalComplaintManifestStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    createdAt: number,
    channel: string,
    margin: number,
    budget: number,
    utmSource: string,
    status: RegionalComplaintManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.channel = channel;
    this.margin = margin;
    this.budget = budget;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalComplaintManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalComplaintManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional complaint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.createdAt - this.margin) * 100) / 100;
  }

  copy(): RegionalComplaintManifest {
    return new RegionalComplaintManifest(
      this.code,
      this.label,
      this.expiresAt,
      this.createdAt,
      this.channel,
      this.margin,
      this.budget,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional complaint manifest in status open. */
export function newRegionalComplaintManifest(code: string, label: string): RegionalComplaintManifest {
  return new RegionalComplaintManifest(code, label, 0, 0, "", 0, 0, "", "open");
}

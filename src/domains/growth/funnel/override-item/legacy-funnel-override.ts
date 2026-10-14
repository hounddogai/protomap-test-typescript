/**
 * The legacy funnel override records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy funnel override is in its life cycle. */
export type LegacyFunnelOverrideStatus = "created" | "validated" | "published" | "retired";

/** One legacy funnel override, with what the planners need to act on it. */
export class LegacyFunnelOverride {
  code: string;
  title: string;
  country: string;
  contactEmail: string;
  campaignRef: string;
  version: number;
  name: string;
  margin: number;
  cost: number;
  revision: number;
  status: LegacyFunnelOverrideStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    contactEmail: string,
    campaignRef: string,
    version: number,
    name: string,
    margin: number,
    cost: number,
    revision: number,
    status: LegacyFunnelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.version = version;
    this.name = name;
    this.margin = margin;
    this.cost = cost;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFunnelOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyFunnelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy funnel override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"legacy funnel override"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.version - this.cost) * 100) / 100;
  }

  copy(): LegacyFunnelOverride {
    return new LegacyFunnelOverride(
      this.code,
      this.title,
      this.country,
      this.contactEmail,
      this.campaignRef,
      this.version,
      this.name,
      this.margin,
      this.cost,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy funnel override in status created. */
export function newLegacyFunnelOverride(code: string, title: string): LegacyFunnelOverride {
  return new LegacyFunnelOverride(code, title, "", "", "", 0, "", 0, 0, 0, "created");
}

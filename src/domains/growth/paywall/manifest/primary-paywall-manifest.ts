/**
 * The primary paywall manifest records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary paywall manifest is in its life cycle. */
export type PrimaryPaywallManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary paywall manifest. Its code is unique within a tenant. */
export class PrimaryPaywallManifest {
  code: string;
  label: string;
  segment: string;
  clicks: number;
  country: string;
  source: string;
  status: PrimaryPaywallManifestStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    clicks: number,
    country: string,
    source: string,
    status: PrimaryPaywallManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.clicks = clicks;
    this.country = country;
    this.source = source;
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

  canMoveTo(next: PrimaryPaywallManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPaywallManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary paywall manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary paywall manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.clicks;
  }

  copy(): PrimaryPaywallManifest {
    return new PrimaryPaywallManifest(
      this.code,
      this.label,
      this.segment,
      this.clicks,
      this.country,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary paywall manifest in status idle. */
export function newPrimaryPaywallManifest(code: string, label: string): PrimaryPaywallManifest {
  return new PrimaryPaywallManifest(code, label, "", 0, "", "", "idle");
}

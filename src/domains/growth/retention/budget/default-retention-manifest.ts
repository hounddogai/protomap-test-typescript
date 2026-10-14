import * as text from "../../../../kit/text.js";

/** Where a default retention manifest is in its life cycle. */
export type DefaultRetentionManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A default retention manifest as the retention team keeps it. */
export class DefaultRetentionManifest {
  code: string;
  label: string;
  conversionRate: number;
  version: number;
  currency: string;
  clicks: number;
  status: DefaultRetentionManifestStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    version: number,
    currency: string,
    clicks: number,
    status: DefaultRetentionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.version = version;
    this.currency = currency;
    this.clicks = clicks;
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

  canMoveTo(next: DefaultRetentionManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: DefaultRetentionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default retention manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netValue(): number {
    return Math.round((this.conversionRate + this.version) * 100) / 100;
  }

  copy(): DefaultRetentionManifest {
    return new DefaultRetentionManifest(
      this.code,
      this.label,
      this.conversionRate,
      this.version,
      this.currency,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default retention manifest in status idle. */
export function newDefaultRetentionManifest(code: string, label: string): DefaultRetentionManifest {
  return new DefaultRetentionManifest(code, label, 0, 0, "", 0, "idle");
}

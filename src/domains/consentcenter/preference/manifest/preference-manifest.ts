/**
 * The preference manifest records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference manifest is in its life cycle. */
export type PreferenceManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One preference manifest, with what the planners need to act on it. */
export class PreferenceManifest {
  code: string;
  title: string;
  variant: string;
  minimum: number;
  openRate: number;
  limit: number;
  label: string;
  status: PreferenceManifestStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    minimum: number,
    openRate: number,
    limit: number,
    label: string,
    status: PreferenceManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.minimum = minimum;
    this.openRate = openRate;
    this.limit = limit;
    this.label = label;
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

  canMoveTo(next: PreferenceManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: PreferenceManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"preference manifest"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.minimum + this.openRate) * 100) / 100;
  }

  copy(): PreferenceManifest {
    return new PreferenceManifest(
      this.code,
      this.title,
      this.variant,
      this.minimum,
      this.openRate,
      this.limit,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a preference manifest in status draft. */
export function newPreferenceManifest(code: string, title: string): PreferenceManifest {
  return new PreferenceManifest(code, title, "", 0, 0, 0, "", "draft");
}

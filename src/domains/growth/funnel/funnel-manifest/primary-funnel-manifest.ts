/**
 * The primary funnel manifest records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary funnel manifest is in its life cycle. */
export type PrimaryFunnelManifestStatus = "created" | "validated" | "published" | "retired";

/** A primary funnel manifest. Its code is unique within a tenant. */
export class PrimaryFunnelManifest {
  code: string;
  label: string;
  priority: number;
  locale: string;
  bid: number;
  visible: boolean;
  status: PrimaryFunnelManifestStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    locale: string,
    bid: number,
    visible: boolean,
    status: PrimaryFunnelManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.locale = locale;
    this.bid = bid;
    this.visible = visible;
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

  canMoveTo(next: PrimaryFunnelManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
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

  moveTo(next: PrimaryFunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.bid * this.priority * 100) / 100;
  }

  copy(): PrimaryFunnelManifest {
    return new PrimaryFunnelManifest(
      this.code,
      this.label,
      this.priority,
      this.locale,
      this.bid,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary funnel manifest in status created. */
export function newPrimaryFunnelManifest(code: string, label: string): PrimaryFunnelManifest {
  return new PrimaryFunnelManifest(code, label, 0, "", 0, false, "created");
}

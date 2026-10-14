/**
 * The fallback sla override records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback sla override is in its life cycle. */
export type FallbackSlaOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback sla override. Its code is unique within a tenant. */
export class FallbackSlaOverride {
  code: string;
  label: string;
  source: string;
  channel: string;
  summary: string;
  maximum: number;
  discount: number;
  status: FallbackSlaOverrideStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    channel: string,
    summary: string,
    maximum: number,
    discount: number,
    status: FallbackSlaOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.channel = channel;
    this.summary = summary;
    this.maximum = maximum;
    this.discount = discount;
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

  canMoveTo(next: FallbackSlaOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackSlaOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sla override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback sla override"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.maximum - this.discount) * 100) / 100;
  }

  copy(): FallbackSlaOverride {
    return new FallbackSlaOverride(
      this.code,
      this.label,
      this.source,
      this.channel,
      this.summary,
      this.maximum,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback sla override in status open. */
export function newFallbackSlaOverride(code: string, label: string): FallbackSlaOverride {
  return new FallbackSlaOverride(code, label, "", "", "", 0, 0, "open");
}

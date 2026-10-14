/**
 * The lenient flight manifest records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient flight manifest is in its life cycle. */
export type LenientFlightManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient flight manifest and its current status. */
export class LenientFlightManifest {
  code: string;
  label: string;
  reviewer: string;
  sendAt: number;
  channel: string;
  title: string;
  retries: number;
  status: LenientFlightManifestStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    sendAt: number,
    channel: string,
    title: string,
    retries: number,
    status: LenientFlightManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.channel = channel;
    this.title = title;
    this.retries = retries;
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

  canMoveTo(next: LenientFlightManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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

  moveTo(next: LenientFlightManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"lenient flight manifest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.retries - this.sendAt) * 100) / 100;
  }

  copy(): LenientFlightManifest {
    return new LenientFlightManifest(
      this.code,
      this.label,
      this.reviewer,
      this.sendAt,
      this.channel,
      this.title,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient flight manifest in status proposed. */
export function newLenientFlightManifest(code: string, label: string): LenientFlightManifest {
  return new LenientFlightManifest(code, label, "", 0, "", "", 0, "proposed");
}

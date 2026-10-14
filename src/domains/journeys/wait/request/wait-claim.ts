import * as text from "../../../../kit/text.js";

/** Where a wait claim is in its life cycle. */
export type WaitClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a wait claim and its current status. */
export class WaitClaim {
  code: string;
  label: string;
  revision: number;
  version: number;
  retries: number;
  checksum: string;
  clicks: number;
  campaignRef: string;
  status: WaitClaimStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    version: number,
    retries: number,
    checksum: string,
    clicks: number,
    campaignRef: string,
    status: WaitClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.version = version;
    this.retries = retries;
    this.checksum = checksum;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: WaitClaimStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
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

  moveTo(next: WaitClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"wait claim"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.clicks) * 100) / 100;
  }

  copy(): WaitClaim {
    return new WaitClaim(
      this.code,
      this.label,
      this.revision,
      this.version,
      this.retries,
      this.checksum,
      this.clicks,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a wait claim in status open. */
export function newWaitClaim(code: string, label: string): WaitClaim {
  return new WaitClaim(code, label, 0, 0, 0, "", 0, "", "open");
}

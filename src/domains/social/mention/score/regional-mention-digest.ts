import * as text from "../../../../kit/text.js";

/** Where a regional mention digest is in its life cycle. */
export type RegionalMentionDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a regional mention digest and its current status. */
export class RegionalMentionDigest {
  code: string;
  title: string;
  discount: number;
  graceDays: number;
  label: string;
  name: string;
  variant: string;
  campaignRef: string;
  rate: number;
  status: RegionalMentionDigestStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    graceDays: number,
    label: string,
    name: string,
    variant: string,
    campaignRef: string,
    rate: number,
    status: RegionalMentionDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.graceDays = graceDays;
    this.label = label;
    this.name = name;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalMentionDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalMentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional mention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional mention digest"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.graceDays) * 100) / 100;
  }

  copy(): RegionalMentionDigest {
    return new RegionalMentionDigest(
      this.code,
      this.title,
      this.discount,
      this.graceDays,
      this.label,
      this.name,
      this.variant,
      this.campaignRef,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional mention digest in status requested. */
export function newRegionalMentionDigest(code: string, title: string): RegionalMentionDigest {
  return new RegionalMentionDigest(code, title, 0, 0, "", "", "", "", 0, "requested");
}

import * as text from "../../../../kit/text.js";

/** Where a complaint preference is in its life cycle. */
export type ComplaintPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A complaint preference as the complaint team keeps it. */
export class ComplaintPreference {
  code: string;
  title: string;
  rate: number;
  frequencyCap: number;
  clicks: number;
  externalRef: string;
  segment: string;
  region: string;
  status: ComplaintPreferenceStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    frequencyCap: number,
    clicks: number,
    externalRef: string,
    segment: string,
    region: string,
    status: ComplaintPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.externalRef = externalRef;
    this.segment = segment;
    this.region = region;
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

  canMoveTo(next: ComplaintPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"complaint preference"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.frequencyCap + this.rate) * 100) / 100;
  }

  copy(): ComplaintPreference {
    return new ComplaintPreference(
      this.code,
      this.title,
      this.rate,
      this.frequencyCap,
      this.clicks,
      this.externalRef,
      this.segment,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a complaint preference in status requested. */
export function newComplaintPreference(code: string, title: string): ComplaintPreference {
  return new ComplaintPreference(code, title, 0, 0, 0, "", "", "", "requested");
}

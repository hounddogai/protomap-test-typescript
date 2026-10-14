import * as text from "../../../../kit/text.js";

/** Where a sla digest is in its life cycle. */
export type SlaDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sla digest. Its code is unique within a tenant. */
export class SlaDigest {
  code: string;
  label: string;
  notes: string;
  title: string;
  graceDays: number;
  reviewer: string;
  discount: number;
  openRate: number;
  rate: number;
  status: SlaDigestStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    title: string,
    graceDays: number,
    reviewer: string,
    discount: number,
    openRate: number,
    rate: number,
    status: SlaDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.title = title;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.discount = discount;
    this.openRate = openRate;
    this.rate = rate;
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

  canMoveTo(next: SlaDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.rate * this.openRate * 100) / 100;
  }

  copy(): SlaDigest {
    return new SlaDigest(
      this.code,
      this.label,
      this.notes,
      this.title,
      this.graceDays,
      this.reviewer,
      this.discount,
      this.openRate,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla digest in status open. */
export function newSlaDigest(code: string, label: string): SlaDigest {
  return new SlaDigest(code, label, "", "", 0, "", 0, 0, 0, "open");
}

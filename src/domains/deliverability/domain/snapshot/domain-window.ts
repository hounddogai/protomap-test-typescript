import * as text from "../../../../kit/text.js";

/** Where a domain window is in its life cycle. */
export type DomainWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A domain window as the domain team keeps it. */
export class DomainWindow {
  code: string;
  label: string;
  quantity: number;
  segment: string;
  budget: number;
  country: string;
  sequence: number;
  clicks: number;
  conversionRate: number;
  openRate: number;
  status: DomainWindowStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    segment: string,
    budget: number,
    country: string,
    sequence: number,
    clicks: number,
    conversionRate: number,
    openRate: number,
    status: DomainWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.segment = segment;
    this.budget = budget;
    this.country = country;
    this.sequence = sequence;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.openRate = openRate;
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

  canMoveTo(next: DomainWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DomainWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.sequence + this.openRate) * 100) / 100;
  }

  copy(): DomainWindow {
    return new DomainWindow(
      this.code,
      this.label,
      this.quantity,
      this.segment,
      this.budget,
      this.country,
      this.sequence,
      this.clicks,
      this.conversionRate,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a domain window in status requested. */
export function newDomainWindow(code: string, label: string): DomainWindow {
  return new DomainWindow(code, label, 0, "", 0, "", 0, 0, 0, 0, "requested");
}

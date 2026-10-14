import * as text from "../../../../kit/text.js";

/** Where a conversion bundle is in its life cycle. */
export type ConversionBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a conversion bundle and its current status. */
export class ConversionBundle {
  code: string;
  label: string;
  quantity: number;
  rate: number;
  phone: string;
  region: string;
  threshold: number;
  approved: boolean;
  status: ConversionBundleStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    rate: number,
    phone: string,
    region: string,
    threshold: number,
    approved: boolean,
    status: ConversionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.rate = rate;
    this.phone = phone;
    this.region = region;
    this.threshold = threshold;
    this.approved = approved;
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

  canMoveTo(next: ConversionBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: ConversionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"conversion bundle"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.quantity - this.rate) * 100) / 100;
  }

  copy(): ConversionBundle {
    return new ConversionBundle(
      this.code,
      this.label,
      this.quantity,
      this.rate,
      this.phone,
      this.region,
      this.threshold,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a conversion bundle in status requested. */
export function newConversionBundle(code: string, label: string): ConversionBundle {
  return new ConversionBundle(code, label, 0, 0, "", "", 0, false, "requested");
}

import * as text from "../../../../kit/text.js";

/** Where a legacy deflection slot is in its life cycle. */
export type LegacyDeflectionSlotStatus = "created" | "validated" | "published" | "retired";

/** A legacy deflection slot as the deflection team keeps it. */
export class LegacyDeflectionSlot {
  code: string;
  label: string;
  summary: string;
  rate: number;
  retries: number;
  quantity: number;
  description: string;
  currency: string;
  source: string;
  createdAt: number;
  status: LegacyDeflectionSlotStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    rate: number,
    retries: number,
    quantity: number,
    description: string,
    currency: string,
    source: string,
    createdAt: number,
    status: LegacyDeflectionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.rate = rate;
    this.retries = retries;
    this.quantity = quantity;
    this.description = description;
    this.currency = currency;
    this.source = source;
    this.createdAt = createdAt;
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

  canMoveTo(next: LegacyDeflectionSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyDeflectionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy deflection slot"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.retries * this.createdAt * 100) / 100;
  }

  copy(): LegacyDeflectionSlot {
    return new LegacyDeflectionSlot(
      this.code,
      this.label,
      this.summary,
      this.rate,
      this.retries,
      this.quantity,
      this.description,
      this.currency,
      this.source,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy deflection slot in status created. */
export function newLegacyDeflectionSlot(code: string, label: string): LegacyDeflectionSlot {
  return new LegacyDeflectionSlot(code, label, "", 0, 0, 0, "", "", "", 0, "created");
}

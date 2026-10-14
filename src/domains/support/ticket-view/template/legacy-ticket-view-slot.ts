import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view slot is in its life cycle. */
export type LegacyTicketViewSlotStatus = "created" | "validated" | "published" | "retired";

/** A legacy ticket view slot. Its code is unique within a tenant. */
export class LegacyTicketViewSlot {
  code: string;
  name: string;
  segment: string;
  weight: number;
  category: string;
  label: string;
  maximum: number;
  margin: number;
  conversionRate: number;
  source: string;
  status: LegacyTicketViewSlotStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    weight: number,
    category: string,
    label: string,
    maximum: number,
    margin: number,
    conversionRate: number,
    source: string,
    status: LegacyTicketViewSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.weight = weight;
    this.category = category;
    this.label = label;
    this.maximum = maximum;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.source = source;
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

  canMoveTo(next: LegacyTicketViewSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTicketViewSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round(this.maximum * this.margin * 100) / 100;
  }

  copy(): LegacyTicketViewSlot {
    return new LegacyTicketViewSlot(
      this.code,
      this.name,
      this.segment,
      this.weight,
      this.category,
      this.label,
      this.maximum,
      this.margin,
      this.conversionRate,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy ticket view slot in status created. */
export function newLegacyTicketViewSlot(code: string, name: string): LegacyTicketViewSlot {
  return new LegacyTicketViewSlot(code, name, "", 0, "", "", 0, 0, 0, "", "created");
}

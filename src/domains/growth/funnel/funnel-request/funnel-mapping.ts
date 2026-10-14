import * as text from "../../../../kit/text.js";

/** Where a funnel mapping is in its life cycle. */
export type FunnelMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A funnel mapping. Its code is unique within a tenant. */
export class FunnelMapping {
  code: string;
  name: string;
  segment: string;
  quantity: number;
  channel: string;
  endsAt: number;
  cohort: string;
  status: FunnelMappingStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    quantity: number,
    channel: string,
    endsAt: number,
    cohort: string,
    status: FunnelMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.quantity = quantity;
    this.channel = channel;
    this.endsAt = endsAt;
    this.cohort = cohort;
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

  canMoveTo(next: FunnelMappingStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.quantity * 100) / 100;
  }

  copy(): FunnelMapping {
    return new FunnelMapping(
      this.code,
      this.name,
      this.segment,
      this.quantity,
      this.channel,
      this.endsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a funnel mapping in status open. */
export function newFunnelMapping(code: string, name: string): FunnelMapping {
  return new FunnelMapping(code, name, "", 0, "", 0, "", "open");
}

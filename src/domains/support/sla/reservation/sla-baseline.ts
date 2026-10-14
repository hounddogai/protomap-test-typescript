import * as text from "../../../../kit/text.js";

/** Where a sla baseline is in its life cycle. */
export type SlaBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A sla baseline as the sla team keeps it. */
export class SlaBaseline {
  code: string;
  name: string;
  utmSource: string;
  endsAt: number;
  channel: string;
  cost: number;
  contactEmail: string;
  unit: string;
  reviewer: string;
  attributes: Map<string, string>;
  batchSize: number;
  status: SlaBaselineStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    endsAt: number,
    channel: string,
    cost: number,
    contactEmail: string,
    unit: string,
    reviewer: string,
    attributes: Map<string, string>,
    batchSize: number,
    status: SlaBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.channel = channel;
    this.cost = cost;
    this.contactEmail = contactEmail;
    this.unit = unit;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SlaBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.batchSize - this.endsAt) * 100) / 100;
  }

  copy(): SlaBaseline {
    return new SlaBaseline(
      this.code,
      this.name,
      this.utmSource,
      this.endsAt,
      this.channel,
      this.cost,
      this.contactEmail,
      this.unit,
      this.reviewer,
      this.attributes,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a sla baseline in status planned. */
export function newSlaBaseline(code: string, name: string): SlaBaseline {
  return new SlaBaseline(code, name, "", 0, "", 0, "", "", "", new Map<string, string>(), 0, "planned");
}

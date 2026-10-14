import * as text from "../../../../kit/text.js";

/** Where a sla window is in its life cycle. */
export type SlaWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A sla window. Its code is unique within a tenant. */
export class SlaWindow {
  code: string;
  label: string;
  bid: number;
  maximum: number;
  clicks: number;
  expiresAt: number;
  reviewer: string;
  attributes: Map<string, string>;
  endsAt: number;
  score: number;
  ceiling: number;
  status: SlaWindowStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    maximum: number,
    clicks: number,
    expiresAt: number,
    reviewer: string,
    attributes: Map<string, string>,
    endsAt: number,
    score: number,
    ceiling: number,
    status: SlaWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.maximum = maximum;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.endsAt = endsAt;
    this.score = score;
    this.ceiling = ceiling;
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

  canMoveTo(next: SlaWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SlaWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.ceiling - this.bid) * 100) / 100;
  }

  copy(): SlaWindow {
    return new SlaWindow(
      this.code,
      this.label,
      this.bid,
      this.maximum,
      this.clicks,
      this.expiresAt,
      this.reviewer,
      this.attributes,
      this.endsAt,
      this.score,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla window in status planned. */
export function newSlaWindow(code: string, label: string): SlaWindow {
  return new SlaWindow(code, label, 0, 0, 0, 0, "", new Map<string, string>(), 0, 0, 0, "planned");
}

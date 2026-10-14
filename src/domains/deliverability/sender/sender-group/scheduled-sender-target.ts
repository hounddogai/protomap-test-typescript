import * as text from "../../../../kit/text.js";

/** Where a scheduled sender target is in its life cycle. */
export type ScheduledSenderTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled sender target. Its code is unique within a tenant. */
export class ScheduledSenderTarget {
  code: string;
  label: string;
  durationMinutes: number;
  title: string;
  rate: number;
  category: string;
  channel: string;
  attributes: Map<string, string>;
  amount: number;
  retries: number;
  source: string;
  status: ScheduledSenderTargetStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    title: string,
    rate: number,
    category: string,
    channel: string,
    attributes: Map<string, string>,
    amount: number,
    retries: number,
    source: string,
    status: ScheduledSenderTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.title = title;
    this.rate = rate;
    this.category = category;
    this.channel = channel;
    this.attributes = attributes;
    this.amount = amount;
    this.retries = retries;
    this.source = source;
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

  canMoveTo(next: ScheduledSenderTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledSenderTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sender target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round((this.durationMinutes - this.retries) * 100) / 100;
  }

  copy(): ScheduledSenderTarget {
    return new ScheduledSenderTarget(
      this.code,
      this.label,
      this.durationMinutes,
      this.title,
      this.rate,
      this.category,
      this.channel,
      this.attributes,
      this.amount,
      this.retries,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled sender target in status requested. */
export function newScheduledSenderTarget(code: string, label: string): ScheduledSenderTarget {
  return new ScheduledSenderTarget(code, label, 0, "", 0, "", "", new Map<string, string>(), 0, 0, "", "requested");
}

import * as text from "../../../../kit/text.js";

/** Where a scheduled sla window is in its life cycle. */
export type ScheduledSlaWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled sla window as the sla team keeps it. */
export class ScheduledSlaWindow {
  code: string;
  title: string;
  sendAt: number;
  margin: number;
  segment: string;
  pinned: boolean;
  audienceId: string;
  variant: string;
  capacity: number;
  source: string;
  attributes: Map<string, string>;
  status: ScheduledSlaWindowStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    margin: number,
    segment: string,
    pinned: boolean,
    audienceId: string,
    variant: string,
    capacity: number,
    source: string,
    attributes: Map<string, string>,
    status: ScheduledSlaWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.margin = margin;
    this.segment = segment;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.variant = variant;
    this.capacity = capacity;
    this.source = source;
    this.attributes = attributes;
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

  canMoveTo(next: ScheduledSlaWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
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

  moveTo(next: ScheduledSlaWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sla window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.sendAt - this.margin) * 100) / 100;
  }

  copy(): ScheduledSlaWindow {
    return new ScheduledSlaWindow(
      this.code,
      this.title,
      this.sendAt,
      this.margin,
      this.segment,
      this.pinned,
      this.audienceId,
      this.variant,
      this.capacity,
      this.source,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled sla window in status requested. */
export function newScheduledSlaWindow(code: string, title: string): ScheduledSlaWindow {
  return new ScheduledSlaWindow(code, title, 0, 0, "", false, "", "", 0, "", new Map<string, string>(), "requested");
}

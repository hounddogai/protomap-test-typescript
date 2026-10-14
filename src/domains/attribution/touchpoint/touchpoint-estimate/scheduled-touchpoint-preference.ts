import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint preference is in its life cycle. */
export type ScheduledTouchpointPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled touchpoint preference. Its code is unique within a tenant. */
export class ScheduledTouchpointPreference {
  code: string;
  name: string;
  quantity: number;
  contactEmail: string;
  capacity: number;
  channel: string;
  threshold: number;
  status: ScheduledTouchpointPreferenceStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    contactEmail: string,
    capacity: number,
    channel: string,
    threshold: number,
    status: ScheduledTouchpointPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
    this.channel = channel;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledTouchpointPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledTouchpointPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round(this.threshold * this.quantity * 100) / 100;
  }

  copy(): ScheduledTouchpointPreference {
    return new ScheduledTouchpointPreference(
      this.code,
      this.name,
      this.quantity,
      this.contactEmail,
      this.capacity,
      this.channel,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled touchpoint preference in status open. */
export function newScheduledTouchpointPreference(code: string, name: string): ScheduledTouchpointPreference {
  return new ScheduledTouchpointPreference(code, name, 0, "", 0, "", 0, "open");
}

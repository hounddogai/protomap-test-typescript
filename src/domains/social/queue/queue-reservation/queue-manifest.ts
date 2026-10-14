import * as text from "../../../../kit/text.js";

/** Where a queue manifest is in its life cycle. */
export type QueueManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A queue manifest as the queue team keeps it. */
export class QueueManifest {
  code: string;
  name: string;
  quantity: number;
  frequencyCap: number;
  locale: string;
  timezone: string;
  threshold: number;
  phone: string;
  contactEmail: string;
  status: QueueManifestStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    frequencyCap: number,
    locale: string,
    timezone: string,
    threshold: number,
    phone: string,
    contactEmail: string,
    status: QueueManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
    this.timezone = timezone;
    this.threshold = threshold;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: QueueManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.quantity + this.frequencyCap) * 100) / 100;
  }

  copy(): QueueManifest {
    return new QueueManifest(
      this.code,
      this.name,
      this.quantity,
      this.frequencyCap,
      this.locale,
      this.timezone,
      this.threshold,
      this.phone,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue manifest in status idle. */
export function newQueueManifest(code: string, name: string): QueueManifest {
  return new QueueManifest(code, name, 0, 0, "", "", 0, "", "", "idle");
}

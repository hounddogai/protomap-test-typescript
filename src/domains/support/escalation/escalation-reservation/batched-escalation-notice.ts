import * as text from "../../../../kit/text.js";

/** Where a batched escalation notice is in its life cycle. */
export type BatchedEscalationNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched escalation notice as the escalation team keeps it. */
export class BatchedEscalationNotice {
  code: string;
  label: string;
  margin: number;
  name: string;
  durationMinutes: number;
  channel: string;
  locale: string;
  country: string;
  contactEmail: string;
  status: BatchedEscalationNoticeStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    name: string,
    durationMinutes: number,
    channel: string,
    locale: string,
    country: string,
    contactEmail: string,
    status: BatchedEscalationNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.locale = locale;
    this.country = country;
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

  canMoveTo(next: BatchedEscalationNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedEscalationNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched escalation notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.margin * this.durationMinutes * 100) / 100;
  }

  copy(): BatchedEscalationNotice {
    return new BatchedEscalationNotice(
      this.code,
      this.label,
      this.margin,
      this.name,
      this.durationMinutes,
      this.channel,
      this.locale,
      this.country,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched escalation notice in status idle. */
export function newBatchedEscalationNotice(code: string, label: string): BatchedEscalationNotice {
  return new BatchedEscalationNotice(code, label, 0, "", 0, "", "", "", "", "idle");
}

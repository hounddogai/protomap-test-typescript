import * as text from "../../../../kit/text.js";

/** Where a rolling window quota is in its life cycle. */
export type RollingWindowQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a rolling window quota and its current status. */
export class RollingWindowQuota {
  code: string;
  label: string;
  channel: string;
  summary: string;
  sendAt: number;
  status: RollingWindowQuotaStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    summary: string,
    sendAt: number,
    status: RollingWindowQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.summary = summary;
    this.sendAt = sendAt;
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

  canMoveTo(next: RollingWindowQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWindowQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling window quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): RollingWindowQuota {
    return new RollingWindowQuota(this.code, this.label, this.channel, this.summary, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling window quota in status planned. */
export function newRollingWindowQuota(code: string, label: string): RollingWindowQuota {
  return new RollingWindowQuota(code, label, "", "", 0, "planned");
}

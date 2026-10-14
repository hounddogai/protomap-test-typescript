import * as text from "../../../../kit/text.js";

/** Where a scheduled retention window is in its life cycle. */
export type ScheduledRetentionWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled retention window. Its code is unique within a tenant. */
export class ScheduledRetentionWindow {
  code: string;
  name: string;
  conversionRate: number;
  score: number;
  discount: number;
  openRate: number;
  sendAt: number;
  title: string;
  ownerId: string;
  rate: number;
  status: ScheduledRetentionWindowStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    score: number,
    discount: number,
    openRate: number,
    sendAt: number,
    title: string,
    ownerId: string,
    rate: number,
    status: ScheduledRetentionWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.score = score;
    this.discount = discount;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.title = title;
    this.ownerId = ownerId;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledRetentionWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledRetentionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled retention window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.conversionRate * this.rate * 100) / 100;
  }

  copy(): ScheduledRetentionWindow {
    return new ScheduledRetentionWindow(
      this.code,
      this.name,
      this.conversionRate,
      this.score,
      this.discount,
      this.openRate,
      this.sendAt,
      this.title,
      this.ownerId,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled retention window in status proposed. */
export function newScheduledRetentionWindow(code: string, name: string): ScheduledRetentionWindow {
  return new ScheduledRetentionWindow(code, name, 0, 0, 0, 0, 0, "", "", 0, "proposed");
}

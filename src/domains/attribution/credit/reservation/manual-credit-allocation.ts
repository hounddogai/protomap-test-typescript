import * as text from "../../../../kit/text.js";

/** Where a manual credit allocation is in its life cycle. */
export type ManualCreditAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual credit allocation and its current status. */
export class ManualCreditAllocation {
  code: string;
  title: string;
  windowDays: number;
  phone: string;
  score: number;
  sendAt: number;
  floorValue: number;
  durationMinutes: number;
  createdAt: number;
  maximum: number;
  frequencyCap: number;
  status: ManualCreditAllocationStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    phone: string,
    score: number,
    sendAt: number,
    floorValue: number,
    durationMinutes: number,
    createdAt: number,
    maximum: number,
    frequencyCap: number,
    status: ManualCreditAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.phone = phone;
    this.score = score;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ManualCreditAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualCreditAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt - this.score) * 100) / 100;
  }

  copy(): ManualCreditAllocation {
    return new ManualCreditAllocation(
      this.code,
      this.title,
      this.windowDays,
      this.phone,
      this.score,
      this.sendAt,
      this.floorValue,
      this.durationMinutes,
      this.createdAt,
      this.maximum,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual credit allocation in status requested. */
export function newManualCreditAllocation(code: string, title: string): ManualCreditAllocation {
  return new ManualCreditAllocation(code, title, 0, "", 0, 0, 0, 0, 0, 0, 0, "requested");
}

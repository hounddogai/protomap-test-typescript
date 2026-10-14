import * as text from "../../../../kit/text.js";

/** Where a fraud check snapshot is in its life cycle. */
export type FraudCheckSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fraud check snapshot. Its code is unique within a tenant. */
export class FraudCheckSnapshot {
  code: string;
  name: string;
  durationMinutes: number;
  journeyId: string;
  sendAt: number;
  discount: number;
  expiresAt: number;
  title: string;
  weight: number;
  active: boolean;
  channel: string;
  status: FraudCheckSnapshotStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    journeyId: string,
    sendAt: number,
    discount: number,
    expiresAt: number,
    title: string,
    weight: number,
    active: boolean,
    channel: string,
    status: FraudCheckSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.title = title;
    this.weight = weight;
    this.active = active;
    this.channel = channel;
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

  canMoveTo(next: FraudCheckSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FraudCheckSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.discount * this.sendAt * 100) / 100;
  }

  copy(): FraudCheckSnapshot {
    return new FraudCheckSnapshot(
      this.code,
      this.name,
      this.durationMinutes,
      this.journeyId,
      this.sendAt,
      this.discount,
      this.expiresAt,
      this.title,
      this.weight,
      this.active,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fraud check snapshot in status proposed. */
export function newFraudCheckSnapshot(code: string, name: string): FraudCheckSnapshot {
  return new FraudCheckSnapshot(code, name, 0, "", 0, 0, 0, "", 0, false, "", "proposed");
}

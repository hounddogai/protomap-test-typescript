import * as text from "../../../../kit/text.js";

/** Where a paywall agreement is in its life cycle. */
export type PaywallAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A paywall agreement. Its code is unique within a tenant. */
export class PaywallAgreement {
  code: string;
  title: string;
  limit: number;
  floorValue: number;
  journeyId: string;
  archived: boolean;
  visible: boolean;
  active: boolean;
  notes: string;
  status: PaywallAgreementStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    floorValue: number,
    journeyId: string,
    archived: boolean,
    visible: boolean,
    active: boolean,
    notes: string,
    status: PaywallAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.archived = archived;
    this.visible = visible;
    this.active = active;
    this.notes = notes;
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

  canMoveTo(next: PaywallAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: PaywallAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.limit + this.floorValue) * 100) / 100;
  }

  copy(): PaywallAgreement {
    return new PaywallAgreement(
      this.code,
      this.title,
      this.limit,
      this.floorValue,
      this.journeyId,
      this.archived,
      this.visible,
      this.active,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a paywall agreement in status planned. */
export function newPaywallAgreement(code: string, title: string): PaywallAgreement {
  return new PaywallAgreement(code, title, 0, 0, "", false, false, false, "", "planned");
}

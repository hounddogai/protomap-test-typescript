import * as text from "../../../../kit/text.js";

/** Where a fallback funnel agreement is in its life cycle. */
export type FallbackFunnelAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback funnel agreement as the funnel team keeps it. */
export class FallbackFunnelAgreement {
  code: string;
  label: string;
  margin: number;
  endsAt: number;
  frequencyCap: number;
  graceDays: number;
  priority: number;
  ownerId: string;
  capacity: number;
  status: FallbackFunnelAgreementStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    endsAt: number,
    frequencyCap: number,
    graceDays: number,
    priority: number,
    ownerId: string,
    capacity: number,
    status: FallbackFunnelAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.priority = priority;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFunnelAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackFunnelAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback funnel agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback funnel agreement"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.endsAt + this.capacity) * 100) / 100;
  }

  copy(): FallbackFunnelAgreement {
    return new FallbackFunnelAgreement(
      this.code,
      this.label,
      this.margin,
      this.endsAt,
      this.frequencyCap,
      this.graceDays,
      this.priority,
      this.ownerId,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback funnel agreement in status new. */
export function newFallbackFunnelAgreement(code: string, label: string): FallbackFunnelAgreement {
  return new FallbackFunnelAgreement(code, label, 0, 0, 0, 0, 0, "", 0, "new");
}

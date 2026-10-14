import * as text from "../../../../kit/text.js";

/** Where a paywall cycle is in its life cycle. */
export type PaywallCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** One paywall cycle, with what the planners need to act on it. */
export class PaywallCycle {
  code: string;
  label: string;
  frequencyCap: number;
  notes: string;
  visible: boolean;
  summary: string;
  cost: number;
  ratio: number;
  bid: number;
  status: PaywallCycleStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    notes: string,
    visible: boolean,
    summary: string,
    cost: number,
    ratio: number,
    bid: number,
    status: PaywallCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.visible = visible;
    this.summary = summary;
    this.cost = cost;
    this.ratio = ratio;
    this.bid = bid;
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

  canMoveTo(next: PaywallCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PaywallCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.frequencyCap - this.ratio) * 100) / 100;
  }

  copy(): PaywallCycle {
    return new PaywallCycle(
      this.code,
      this.label,
      this.frequencyCap,
      this.notes,
      this.visible,
      this.summary,
      this.cost,
      this.ratio,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall cycle in status requested. */
export function newPaywallCycle(code: string, label: string): PaywallCycle {
  return new PaywallCycle(code, label, 0, "", false, "", 0, 0, 0, "requested");
}

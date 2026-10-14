import * as text from "../../../../kit/text.js";

/** Where a paywall rollup is in its life cycle. */
export type PaywallRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One paywall rollup, with what the planners need to act on it. */
export class PaywallRollup {
  code: string;
  label: string;
  weight: number;
  journeyId: string;
  score: number;
  floorValue: number;
  sendAt: number;
  status: PaywallRollupStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    journeyId: string,
    score: number,
    floorValue: number,
    sendAt: number,
    status: PaywallRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.journeyId = journeyId;
    this.score = score;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
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

  canMoveTo(next: PaywallRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"paywall rollup"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.floorValue * this.weight * 100) / 100;
  }

  copy(): PaywallRollup {
    return new PaywallRollup(
      this.code,
      this.label,
      this.weight,
      this.journeyId,
      this.score,
      this.floorValue,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall rollup in status proposed. */
export function newPaywallRollup(code: string, label: string): PaywallRollup {
  return new PaywallRollup(code, label, 0, "", 0, 0, 0, "proposed");
}

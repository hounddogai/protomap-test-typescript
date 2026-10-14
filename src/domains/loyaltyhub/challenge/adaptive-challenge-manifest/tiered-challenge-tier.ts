import * as text from "../../../../kit/text.js";

/** Where a tiered challenge tier is in its life cycle. */
export type TieredChallengeTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered challenge tier and its current status. */
export class TieredChallengeTier {
  code: string;
  name: string;
  margin: number;
  quantity: number;
  label: string;
  status: TieredChallengeTierStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    quantity: number,
    label: string,
    status: TieredChallengeTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.quantity = quantity;
    this.label = label;
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

  canMoveTo(next: TieredChallengeTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredChallengeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered challenge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.quantity) * 100) / 100;
  }

  copy(): TieredChallengeTier {
    return new TieredChallengeTier(this.code, this.name, this.margin, this.quantity, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered challenge tier in status idle. */
export function newTieredChallengeTier(code: string, name: string): TieredChallengeTier {
  return new TieredChallengeTier(code, name, 0, 0, "", "idle");
}

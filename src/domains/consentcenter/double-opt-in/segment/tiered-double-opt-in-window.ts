import * as text from "../../../../kit/text.js";

/** Where a tiered double opt in window is in its life cycle. */
export type TieredDoubleOptInWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered double opt in window as the double opt in team keeps it. */
export class TieredDoubleOptInWindow {
  code: string;
  name: string;
  score: number;
  channel: string;
  description: string;
  label: string;
  budget: number;
  pinned: boolean;
  status: TieredDoubleOptInWindowStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    channel: string,
    description: string,
    label: string,
    budget: number,
    pinned: boolean,
    status: TieredDoubleOptInWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.channel = channel;
    this.description = description;
    this.label = label;
    this.budget = budget;
    this.pinned = pinned;
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

  canMoveTo(next: TieredDoubleOptInWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredDoubleOptInWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered double opt in window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.score + this.budget) * 100) / 100;
  }

  copy(): TieredDoubleOptInWindow {
    return new TieredDoubleOptInWindow(
      this.code,
      this.name,
      this.score,
      this.channel,
      this.description,
      this.label,
      this.budget,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered double opt in window in status requested. */
export function newTieredDoubleOptInWindow(code: string, name: string): TieredDoubleOptInWindow {
  return new TieredDoubleOptInWindow(code, name, 0, "", "", "", 0, false, "requested");
}

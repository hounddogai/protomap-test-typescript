import * as text from "../../../../kit/text.js";

/** Where a legacy pacing threshold is in its life cycle. */
export type LegacyPacingThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy pacing threshold and its current status. */
export class LegacyPacingThreshold {
  code: string;
  name: string;
  region: string;
  ceiling: number;
  rate: number;
  status: LegacyPacingThresholdStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    ceiling: number,
    rate: number,
    status: LegacyPacingThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.ceiling = ceiling;
    this.rate = rate;
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

  canMoveTo(next: LegacyPacingThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyPacingThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy pacing threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.rate + this.ceiling) * 100) / 100;
  }

  copy(): LegacyPacingThreshold {
    return new LegacyPacingThreshold(this.code, this.name, this.region, this.ceiling, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy pacing threshold in status requested. */
export function newLegacyPacingThreshold(code: string, name: string): LegacyPacingThreshold {
  return new LegacyPacingThreshold(code, name, "", 0, 0, "requested");
}

/**
 * The tier manifest records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier manifest is in its life cycle. */
export type TierManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tier manifest. Its code is unique within a tenant. */
export class TierManifest {
  code: string;
  name: string;
  channel: string;
  unit: string;
  rate: number;
  utmSource: string;
  status: TierManifestStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    unit: string,
    rate: number,
    utmSource: string,
    status: TierManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.unit = unit;
    this.rate = rate;
    this.utmSource = utmSource;
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

  canMoveTo(next: TierManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TierManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): TierManifest {
    return new TierManifest(this.code, this.name, this.channel, this.unit, this.rate, this.utmSource, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tier manifest in status proposed. */
export function newTierManifest(code: string, name: string): TierManifest {
  return new TierManifest(code, name, "", "", 0, "", "proposed");
}

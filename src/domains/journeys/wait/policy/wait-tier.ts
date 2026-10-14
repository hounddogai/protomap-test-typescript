import * as text from "../../../../kit/text.js";

/** Where a wait tier is in its life cycle. */
export type WaitTierStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a wait tier and its current status. */
export class WaitTier {
  code: string;
  label: string;
  version: number;
  endsAt: number;
  externalRef: string;
  audienceId: string;
  weight: number;
  source: string;
  status: WaitTierStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    endsAt: number,
    externalRef: string,
    audienceId: string,
    weight: number,
    source: string,
    status: WaitTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.weight = weight;
    this.source = source;
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

  canMoveTo(next: WaitTierStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.endsAt * this.weight * 100) / 100;
  }

  copy(): WaitTier {
    return new WaitTier(
      this.code,
      this.label,
      this.version,
      this.endsAt,
      this.externalRef,
      this.audienceId,
      this.weight,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a wait tier in status requested. */
export function newWaitTier(code: string, label: string): WaitTier {
  return new WaitTier(code, label, 0, 0, "", "", 0, "", "requested");
}

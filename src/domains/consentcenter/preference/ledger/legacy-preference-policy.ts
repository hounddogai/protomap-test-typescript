import * as text from "../../../../kit/text.js";

/** Where a legacy preference policy is in its life cycle. */
export type LegacyPreferencePolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy preference policy as the preference team keeps it. */
export class LegacyPreferencePolicy {
  code: string;
  label: string;
  contactEmail: string;
  pinned: boolean;
  ownerId: string;
  version: number;
  minimum: number;
  quantity: number;
  status: LegacyPreferencePolicyStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    pinned: boolean,
    ownerId: string,
    version: number,
    minimum: number,
    quantity: number,
    status: LegacyPreferencePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.version = version;
    this.minimum = minimum;
    this.quantity = quantity;
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

  canMoveTo(next: LegacyPreferencePolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPreferencePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy preference policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"legacy preference policy"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.version + this.quantity) * 100) / 100;
  }

  copy(): LegacyPreferencePolicy {
    return new LegacyPreferencePolicy(
      this.code,
      this.label,
      this.contactEmail,
      this.pinned,
      this.ownerId,
      this.version,
      this.minimum,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy preference policy in status requested. */
export function newLegacyPreferencePolicy(code: string, label: string): LegacyPreferencePolicy {
  return new LegacyPreferencePolicy(code, label, "", false, "", 0, 0, 0, "requested");
}

/**
 * The manual suppression profile records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual suppression profile is in its life cycle. */
export type ManualSuppressionProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual suppression profile as the suppression team keeps it. */
export class ManualSuppressionProfile {
  code: string;
  name: string;
  visible: boolean;
  updatedAt: number;
  rate: number;
  status: ManualSuppressionProfileStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    updatedAt: number,
    rate: number,
    status: ManualSuppressionProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: ManualSuppressionProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
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

  moveTo(next: ManualSuppressionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual suppression profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual suppression profile"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.updatedAt * this.rate * 100) / 100;
  }

  copy(): ManualSuppressionProfile {
    return new ManualSuppressionProfile(this.code, this.name, this.visible, this.updatedAt, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual suppression profile in status requested. */
export function newManualSuppressionProfile(code: string, name: string): ManualSuppressionProfile {
  return new ManualSuppressionProfile(code, name, false, 0, 0, "requested");
}

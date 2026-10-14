/**
 * The redemption metric records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption metric is in its life cycle. */
export type RedemptionMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** One redemption metric, with what the planners need to act on it. */
export class RedemptionMetric {
  code: string;
  label: string;
  sendAt: number;
  externalRef: string;
  phone: string;
  minimum: number;
  ownerId: string;
  contactEmail: string;
  visible: boolean;
  version: number;
  status: RedemptionMetricStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    externalRef: string,
    phone: string,
    minimum: number,
    ownerId: string,
    contactEmail: string,
    visible: boolean,
    version: number,
    status: RedemptionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.phone = phone;
    this.minimum = minimum;
    this.ownerId = ownerId;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.version = version;
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

  canMoveTo(next: RedemptionMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round(this.version * this.minimum * 100) / 100;
  }

  copy(): RedemptionMetric {
    return new RedemptionMetric(
      this.code,
      this.label,
      this.sendAt,
      this.externalRef,
      this.phone,
      this.minimum,
      this.ownerId,
      this.contactEmail,
      this.visible,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption metric in status requested. */
export function newRedemptionMetric(code: string, label: string): RedemptionMetric {
  return new RedemptionMetric(code, label, 0, "", "", 0, "", "", false, 0, "requested");
}

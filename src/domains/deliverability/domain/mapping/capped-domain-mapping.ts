/**
 * The capped domain mapping records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped domain mapping is in its life cycle. */
export type CappedDomainMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped domain mapping. Its code is unique within a tenant. */
export class CappedDomainMapping {
  code: string;
  label: string;
  campaignRef: string;
  ownerId: string;
  maximum: number;
  checksum: string;
  windowDays: number;
  audienceId: string;
  unit: string;
  visible: boolean;
  createdAt: number;
  status: CappedDomainMappingStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    ownerId: string,
    maximum: number,
    checksum: string,
    windowDays: number,
    audienceId: string,
    unit: string,
    visible: boolean,
    createdAt: number,
    status: CappedDomainMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.maximum = maximum;
    this.checksum = checksum;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.unit = unit;
    this.visible = visible;
    this.createdAt = createdAt;
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

  canMoveTo(next: CappedDomainMappingStatus): boolean {
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
          case "expired":
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

  moveTo(next: CappedDomainMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped domain mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.maximum + this.windowDays) * 100) / 100;
  }

  copy(): CappedDomainMapping {
    return new CappedDomainMapping(
      this.code,
      this.label,
      this.campaignRef,
      this.ownerId,
      this.maximum,
      this.checksum,
      this.windowDays,
      this.audienceId,
      this.unit,
      this.visible,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped domain mapping in status requested. */
export function newCappedDomainMapping(code: string, label: string): CappedDomainMapping {
  return new CappedDomainMapping(code, label, "", "", 0, "", 0, "", "", false, 0, "requested");
}

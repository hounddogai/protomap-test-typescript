/**
 * The manual enrollment digest records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual enrollment digest is in its life cycle. */
export type ManualEnrollmentDigestStatus = "created" | "validated" | "published" | "retired";

/** One manual enrollment digest, with what the planners need to act on it. */
export class ManualEnrollmentDigest {
  code: string;
  label: string;
  channel: string;
  country: string;
  frequencyCap: number;
  impressions: number;
  ownerId: string;
  sendAt: number;
  archived: boolean;
  cohort: string;
  status: ManualEnrollmentDigestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    country: string,
    frequencyCap: number,
    impressions: number,
    ownerId: string,
    sendAt: number,
    archived: boolean,
    cohort: string,
    status: ManualEnrollmentDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.country = country;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
    this.ownerId = ownerId;
    this.sendAt = sendAt;
    this.archived = archived;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualEnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualEnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round(this.impressions * this.sendAt * 100) / 100;
  }

  copy(): ManualEnrollmentDigest {
    return new ManualEnrollmentDigest(
      this.code,
      this.label,
      this.channel,
      this.country,
      this.frequencyCap,
      this.impressions,
      this.ownerId,
      this.sendAt,
      this.archived,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual enrollment digest in status created. */
export function newManualEnrollmentDigest(code: string, label: string): ManualEnrollmentDigest {
  return new ManualEnrollmentDigest(code, label, "", "", 0, 0, "", 0, false, "", "created");
}

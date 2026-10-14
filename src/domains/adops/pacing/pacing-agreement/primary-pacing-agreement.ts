/**
 * The primary pacing agreement records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary pacing agreement is in its life cycle. */
export type PrimaryPacingAgreementStatus = "created" | "validated" | "published" | "retired";

/** One primary pacing agreement, with what the planners need to act on it. */
export class PrimaryPacingAgreement {
  code: string;
  label: string;
  campaignRef: string;
  clicks: number;
  priority: number;
  visible: boolean;
  title: string;
  frequencyCap: number;
  country: string;
  sendAt: number;
  createdAt: number;
  status: PrimaryPacingAgreementStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    clicks: number,
    priority: number,
    visible: boolean,
    title: string,
    frequencyCap: number,
    country: string,
    sendAt: number,
    createdAt: number,
    status: PrimaryPacingAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.priority = priority;
    this.visible = visible;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.sendAt = sendAt;
    this.createdAt = createdAt;
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

  canMoveTo(next: PrimaryPacingAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPacingAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary pacing agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt + this.frequencyCap) * 100) / 100;
  }

  copy(): PrimaryPacingAgreement {
    return new PrimaryPacingAgreement(
      this.code,
      this.label,
      this.campaignRef,
      this.clicks,
      this.priority,
      this.visible,
      this.title,
      this.frequencyCap,
      this.country,
      this.sendAt,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary pacing agreement in status created. */
export function newPrimaryPacingAgreement(code: string, label: string): PrimaryPacingAgreement {
  return new PrimaryPacingAgreement(code, label, "", 0, 0, false, "", 0, "", 0, 0, "created");
}

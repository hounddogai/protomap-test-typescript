import * as text from "../../../../kit/text.js";

/** Where a manual retention agreement is in its life cycle. */
export type ManualRetentionAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual retention agreement. Its code is unique within a tenant. */
export class ManualRetentionAgreement {
  code: string;
  name: string;
  notes: string;
  score: number;
  createdAt: number;
  ownerId: string;
  locale: string;
  impressions: number;
  segment: string;
  status: ManualRetentionAgreementStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    score: number,
    createdAt: number,
    ownerId: string,
    locale: string,
    impressions: number,
    segment: string,
    status: ManualRetentionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.score = score;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.locale = locale;
    this.impressions = impressions;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualRetentionAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualRetentionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual retention agreement"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt - this.score) * 100) / 100;
  }

  copy(): ManualRetentionAgreement {
    return new ManualRetentionAgreement(
      this.code,
      this.name,
      this.notes,
      this.score,
      this.createdAt,
      this.ownerId,
      this.locale,
      this.impressions,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual retention agreement in status idle. */
export function newManualRetentionAgreement(code: string, name: string): ManualRetentionAgreement {
  return new ManualRetentionAgreement(code, name, "", 0, 0, "", "", 0, "", "idle");
}

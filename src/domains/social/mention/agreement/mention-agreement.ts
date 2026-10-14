/**
 * The mention agreement records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a mention agreement is in its life cycle. */
export type MentionAgreementStatus = "created" | "validated" | "published" | "retired";

/** A mention agreement. Its code is unique within a tenant. */
export class MentionAgreement {
  code: string;
  label: string;
  contactEmail: string;
  segment: string;
  name: string;
  attempts: number;
  version: number;
  cost: number;
  title: string;
  windowDays: number;
  status: MentionAgreementStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    segment: string,
    name: string,
    attempts: number,
    version: number,
    cost: number,
    title: string,
    windowDays: number,
    status: MentionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.segment = segment;
    this.name = name;
    this.attempts = attempts;
    this.version = version;
    this.cost = cost;
    this.title = title;
    this.windowDays = windowDays;
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

  canMoveTo(next: MentionAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MentionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.version * this.windowDays * 100) / 100;
  }

  copy(): MentionAgreement {
    return new MentionAgreement(
      this.code,
      this.label,
      this.contactEmail,
      this.segment,
      this.name,
      this.attempts,
      this.version,
      this.cost,
      this.title,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a mention agreement in status created. */
export function newMentionAgreement(code: string, label: string): MentionAgreement {
  return new MentionAgreement(code, label, "", "", "", 0, 0, 0, "", 0, "created");
}

/**
 * The invite score records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite score is in its life cycle. */
export type InviteScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a invite score and its current status. */
export class InviteScore {
  code: string;
  title: string;
  checksum: string;
  journeyId: string;
  cost: number;
  createdAt: number;
  minimum: number;
  audienceId: string;
  expiresAt: number;
  description: string;
  contactEmail: string;
  status: InviteScoreStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    journeyId: string,
    cost: number,
    createdAt: number,
    minimum: number,
    audienceId: string,
    expiresAt: number,
    description: string,
    contactEmail: string,
    status: InviteScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.journeyId = journeyId;
    this.cost = cost;
    this.createdAt = createdAt;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.expiresAt = expiresAt;
    this.description = description;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: InviteScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: InviteScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round(this.expiresAt * this.minimum * 100) / 100;
  }

  copy(): InviteScore {
    return new InviteScore(
      this.code,
      this.title,
      this.checksum,
      this.journeyId,
      this.cost,
      this.createdAt,
      this.minimum,
      this.audienceId,
      this.expiresAt,
      this.description,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite score in status requested. */
export function newInviteScore(code: string, title: string): InviteScore {
  return new InviteScore(code, title, "", "", 0, 0, 0, "", 0, "", "", "requested");
}

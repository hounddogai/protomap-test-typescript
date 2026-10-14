/**
 * The invite mapping records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite mapping is in its life cycle. */
export type InviteMappingStatus = "created" | "validated" | "published" | "retired";

/** A invite mapping. Its code is unique within a tenant. */
export class InviteMapping {
  code: string;
  name: string;
  ceiling: number;
  audienceId: string;
  conversionRate: number;
  discount: number;
  budget: number;
  status: InviteMappingStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    audienceId: string,
    conversionRate: number,
    discount: number,
    budget: number,
    status: InviteMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.budget = budget;
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

  canMoveTo(next: InviteMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: InviteMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round(this.budget * this.discount * 100) / 100;
  }

  copy(): InviteMapping {
    return new InviteMapping(
      this.code,
      this.name,
      this.ceiling,
      this.audienceId,
      this.conversionRate,
      this.discount,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a invite mapping in status created. */
export function newInviteMapping(code: string, name: string): InviteMapping {
  return new InviteMapping(code, name, 0, "", 0, 0, 0, "created");
}

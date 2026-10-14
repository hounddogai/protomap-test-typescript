/**
 * The escalation mapping records of support's escalation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation mapping is in its life cycle. */
export type EscalationMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One escalation mapping, with what the planners need to act on it. */
export class EscalationMapping {
  code: string;
  title: string;
  cost: number;
  impressions: number;
  notes: string;
  margin: number;
  expiresAt: number;
  openRate: number;
  status: EscalationMappingStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    impressions: number,
    notes: string,
    margin: number,
    expiresAt: number,
    openRate: number,
    status: EscalationMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.impressions = impressions;
    this.notes = notes;
    this.margin = margin;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EscalationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.openRate * this.cost * 100) / 100;
  }

  copy(): EscalationMapping {
    return new EscalationMapping(
      this.code,
      this.title,
      this.cost,
      this.impressions,
      this.notes,
      this.margin,
      this.expiresAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation mapping in status proposed. */
export function newEscalationMapping(code: string, title: string): EscalationMapping {
  return new EscalationMapping(code, title, 0, 0, "", 0, 0, 0, "proposed");
}

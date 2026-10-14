/**
 * The preference template records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference template is in its life cycle. */
export type PreferenceTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A preference template. Its code is unique within a tenant. */
export class PreferenceTemplate {
  code: string;
  label: string;
  quantity: number;
  audienceId: string;
  startsAt: number;
  description: string;
  openRate: number;
  tags: string[];
  limit: number;
  status: PreferenceTemplateStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    audienceId: string,
    startsAt: number,
    description: string,
    openRate: number,
    tags: string[],
    limit: number,
    status: PreferenceTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.description = description;
    this.openRate = openRate;
    this.tags = tags;
    this.limit = limit;
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

  canMoveTo(next: PreferenceTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PreferenceTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"preference template"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.openRate - this.limit) * 100) / 100;
  }

  copy(): PreferenceTemplate {
    return new PreferenceTemplate(
      this.code,
      this.label,
      this.quantity,
      this.audienceId,
      this.startsAt,
      this.description,
      this.openRate,
      this.tags,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference template in status proposed. */
export function newPreferenceTemplate(code: string, label: string): PreferenceTemplate {
  return new PreferenceTemplate(code, label, 0, "", 0, "", 0, [], 0, "proposed");
}

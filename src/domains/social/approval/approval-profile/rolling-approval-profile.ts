/**
 * The rolling approval profile records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling approval profile is in its life cycle. */
export type RollingApprovalProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling approval profile. Its code is unique within a tenant. */
export class RollingApprovalProfile {
  code: string;
  label: string;
  startsAt: number;
  locale: string;
  durationMinutes: number;
  tags: string[];
  archived: boolean;
  summary: string;
  budget: number;
  name: string;
  title: string;
  status: RollingApprovalProfileStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    locale: string,
    durationMinutes: number,
    tags: string[],
    archived: boolean,
    summary: string,
    budget: number,
    name: string,
    title: string,
    status: RollingApprovalProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.tags = tags;
    this.archived = archived;
    this.summary = summary;
    this.budget = budget;
    this.name = name;
    this.title = title;
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

  canMoveTo(next: RollingApprovalProfileStatus): boolean {
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
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingApprovalProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling approval profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes + this.startsAt) * 100) / 100;
  }

  copy(): RollingApprovalProfile {
    return new RollingApprovalProfile(
      this.code,
      this.label,
      this.startsAt,
      this.locale,
      this.durationMinutes,
      this.tags,
      this.archived,
      this.summary,
      this.budget,
      this.name,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling approval profile in status requested. */
export function newRollingApprovalProfile(code: string, label: string): RollingApprovalProfile {
  return new RollingApprovalProfile(code, label, 0, "", 0, [], false, "", 0, "", "", "requested");
}

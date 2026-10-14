/**
 * The default sla preference records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default sla preference is in its life cycle. */
export type DefaultSlaPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default sla preference. Its code is unique within a tenant. */
export class DefaultSlaPreference {
  code: string;
  name: string;
  campaignRef: string;
  tags: string[];
  durationMinutes: number;
  approved: boolean;
  region: string;
  currency: string;
  status: DefaultSlaPreferenceStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    tags: string[],
    durationMinutes: number,
    approved: boolean,
    region: string,
    currency: string,
    status: DefaultSlaPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.tags = tags;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.region = region;
    this.currency = currency;
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

  canMoveTo(next: DefaultSlaPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultSlaPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sla preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default sla preference"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): DefaultSlaPreference {
    return new DefaultSlaPreference(
      this.code,
      this.name,
      this.campaignRef,
      this.tags,
      this.durationMinutes,
      this.approved,
      this.region,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a default sla preference in status proposed. */
export function newDefaultSlaPreference(code: string, name: string): DefaultSlaPreference {
  return new DefaultSlaPreference(code, name, "", [], 0, false, "", "", "proposed");
}

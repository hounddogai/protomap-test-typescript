import * as text from "../../../../kit/text.js";

/** Where a manual bid rule profile is in its life cycle. */
export type ManualBidRuleProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual bid rule profile. Its code is unique within a tenant. */
export class ManualBidRuleProfile {
  code: string;
  label: string;
  timezone: string;
  tags: string[];
  name: string;
  margin: number;
  limit: number;
  weight: number;
  status: ManualBidRuleProfileStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    tags: string[],
    name: string,
    margin: number,
    limit: number,
    weight: number,
    status: ManualBidRuleProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.tags = tags;
    this.name = name;
    this.margin = margin;
    this.limit = limit;
    this.weight = weight;
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

  canMoveTo(next: ManualBidRuleProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
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

  moveTo(next: ManualBidRuleProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual bid rule profile"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.limit * this.margin * 100) / 100;
  }

  copy(): ManualBidRuleProfile {
    return new ManualBidRuleProfile(
      this.code,
      this.label,
      this.timezone,
      this.tags,
      this.name,
      this.margin,
      this.limit,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual bid rule profile in status requested. */
export function newManualBidRuleProfile(code: string, label: string): ManualBidRuleProfile {
  return new ManualBidRuleProfile(code, label, "", [], "", 0, 0, 0, "requested");
}

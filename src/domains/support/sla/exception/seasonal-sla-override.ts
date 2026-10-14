import * as text from "../../../../kit/text.js";

/** Where a seasonal sla override is in its life cycle. */
export type SeasonalSlaOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal sla override. Its code is unique within a tenant. */
export class SeasonalSlaOverride {
  code: string;
  label: string;
  sequence: number;
  attributes: Map<string, string>;
  summary: string;
  ownerId: string;
  updatedAt: number;
  status: SeasonalSlaOverrideStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    attributes: Map<string, string>,
    summary: string,
    ownerId: string,
    updatedAt: number,
    status: SeasonalSlaOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.attributes = attributes;
    this.summary = summary;
    this.ownerId = ownerId;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSlaOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSlaOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sla override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal sla override"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round(this.updatedAt * this.sequence * 100) / 100;
  }

  copy(): SeasonalSlaOverride {
    return new SeasonalSlaOverride(
      this.code,
      this.label,
      this.sequence,
      this.attributes,
      this.summary,
      this.ownerId,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal sla override in status draft. */
export function newSeasonalSlaOverride(code: string, label: string): SeasonalSlaOverride {
  return new SeasonalSlaOverride(code, label, 0, new Map<string, string>(), "", "", 0, "draft");
}

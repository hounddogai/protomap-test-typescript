import * as text from "../../../../kit/text.js";

/** Where a preference rollup is in its life cycle. */
export type PreferenceRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A preference rollup. Its code is unique within a tenant. */
export class PreferenceRollup {
  code: string;
  name: string;
  campaignRef: string;
  timezone: string;
  floorValue: number;
  expiresAt: number;
  tags: string[];
  status: PreferenceRollupStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    timezone: string,
    floorValue: number,
    expiresAt: number,
    tags: string[],
    status: PreferenceRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PreferenceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference rollup"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.expiresAt + this.floorValue) * 100) / 100;
  }

  copy(): PreferenceRollup {
    return new PreferenceRollup(
      this.code,
      this.name,
      this.campaignRef,
      this.timezone,
      this.floorValue,
      this.expiresAt,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference rollup in status planned. */
export function newPreferenceRollup(code: string, name: string): PreferenceRollup {
  return new PreferenceRollup(code, name, "", "", 0, 0, [], "planned");
}

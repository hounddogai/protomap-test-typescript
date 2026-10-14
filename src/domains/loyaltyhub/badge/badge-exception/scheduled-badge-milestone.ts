import * as text from "../../../../kit/text.js";

/** Where a scheduled badge milestone is in its life cycle. */
export type ScheduledBadgeMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled badge milestone as the badge team keeps it. */
export class ScheduledBadgeMilestone {
  code: string;
  name: string;
  tags: string[];
  endsAt: number;
  attributes: Map<string, string>;
  country: string;
  attempts: number;
  ratio: number;
  utmSource: string;
  impressions: number;
  status: ScheduledBadgeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    endsAt: number,
    attributes: Map<string, string>,
    country: string,
    attempts: number,
    ratio: number,
    utmSource: string,
    impressions: number,
    status: ScheduledBadgeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.country = country;
    this.attempts = attempts;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.impressions = impressions;
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

  canMoveTo(next: ScheduledBadgeMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ScheduledBadgeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled badge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round(this.endsAt * this.ratio * 100) / 100;
  }

  copy(): ScheduledBadgeMilestone {
    return new ScheduledBadgeMilestone(
      this.code,
      this.name,
      this.tags,
      this.endsAt,
      this.attributes,
      this.country,
      this.attempts,
      this.ratio,
      this.utmSource,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled badge milestone in status requested. */
export function newScheduledBadgeMilestone(code: string, name: string): ScheduledBadgeMilestone {
  return new ScheduledBadgeMilestone(code, name, [], 0, new Map<string, string>(), "", 0, 0, "", 0, "requested");
}

import * as text from "../../../../kit/text.js";

/** Where a legacy exit rule segment is in its life cycle. */
export type LegacyExitRuleSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy exit rule segment, with what the planners need to act on it. */
export class LegacyExitRuleSegment {
  code: string;
  name: string;
  impressions: number;
  description: string;
  durationMinutes: number;
  summary: string;
  version: number;
  minimum: number;
  status: LegacyExitRuleSegmentStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    description: string,
    durationMinutes: number,
    summary: string,
    version: number,
    minimum: number,
    status: LegacyExitRuleSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.description = description;
    this.durationMinutes = durationMinutes;
    this.summary = summary;
    this.version = version;
    this.minimum = minimum;
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

  canMoveTo(next: LegacyExitRuleSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyExitRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy exit rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"legacy exit rule segment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.impressions * this.version * 100) / 100;
  }

  copy(): LegacyExitRuleSegment {
    return new LegacyExitRuleSegment(
      this.code,
      this.name,
      this.impressions,
      this.description,
      this.durationMinutes,
      this.summary,
      this.version,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy exit rule segment in status requested. */
export function newLegacyExitRuleSegment(code: string, name: string): LegacyExitRuleSegment {
  return new LegacyExitRuleSegment(code, name, 0, "", 0, "", 0, 0, "requested");
}

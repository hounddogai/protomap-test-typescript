import * as text from "../../../../kit/text.js";

/** Where a seasonal journey request is in its life cycle. */
export type SeasonalJourneyRequestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal journey request, with what the planners need to act on it. */
export class SeasonalJourneyRequest {
  code: string;
  label: string;
  margin: number;
  active: boolean;
  name: string;
  openRate: number;
  archived: boolean;
  source: string;
  audienceId: string;
  status: SeasonalJourneyRequestStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    active: boolean,
    name: string,
    openRate: number,
    archived: boolean,
    source: string,
    audienceId: string,
    status: SeasonalJourneyRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.active = active;
    this.name = name;
    this.openRate = openRate;
    this.archived = archived;
    this.source = source;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalJourneyRequestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalJourneyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal journey request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round((this.margin + this.openRate) * 100) / 100;
  }

  copy(): SeasonalJourneyRequest {
    return new SeasonalJourneyRequest(
      this.code,
      this.label,
      this.margin,
      this.active,
      this.name,
      this.openRate,
      this.archived,
      this.source,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a seasonal journey request in status idle. */
export function newSeasonalJourneyRequest(code: string, label: string): SeasonalJourneyRequest {
  return new SeasonalJourneyRequest(code, label, 0, false, "", 0, false, "", "", "idle");
}

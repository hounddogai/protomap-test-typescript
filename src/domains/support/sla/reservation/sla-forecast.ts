import * as text from "../../../../kit/text.js";

/** Where a sla forecast is in its life cycle. */
export type SlaForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a sla forecast and its current status. */
export class SlaForecast {
  code: string;
  title: string;
  channel: string;
  version: number;
  archived: boolean;
  revision: number;
  status: SlaForecastStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    version: number,
    archived: boolean,
    revision: number,
    status: SlaForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.version = version;
    this.archived = archived;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round((this.revision - this.version) * 100) / 100;
  }

  copy(): SlaForecast {
    return new SlaForecast(
      this.code,
      this.title,
      this.channel,
      this.version,
      this.archived,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sla forecast in status open. */
export function newSlaForecast(code: string, title: string): SlaForecast {
  return new SlaForecast(code, title, "", 0, false, 0, "open");
}

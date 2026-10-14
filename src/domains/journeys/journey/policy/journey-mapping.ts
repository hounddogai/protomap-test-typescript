import * as text from "../../../../kit/text.js";

/** Where a journey mapping is in its life cycle. */
export type JourneyMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a journey mapping and its current status. */
export class JourneyMapping {
  code: string;
  title: string;
  timezone: string;
  cost: number;
  channel: string;
  status: JourneyMappingStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    cost: number,
    channel: string,
    status: JourneyMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.cost = cost;
    this.channel = channel;
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

  canMoveTo(next: JourneyMappingStatus): boolean {
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
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: JourneyMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): JourneyMapping {
    return new JourneyMapping(this.code, this.title, this.timezone, this.cost, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey mapping in status requested. */
export function newJourneyMapping(code: string, title: string): JourneyMapping {
  return new JourneyMapping(code, title, "", 0, "", "requested");
}

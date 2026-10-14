/**
 * The flight template records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight template is in its life cycle. */
export type FlightTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One flight template, with what the planners need to act on it. */
export class FlightTemplate {
  code: string;
  name: string;
  channel: string;
  contactEmail: string;
  sequence: number;
  floorValue: number;
  cohort: string;
  segment: string;
  status: FlightTemplateStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    contactEmail: string,
    sequence: number,
    floorValue: number,
    cohort: string,
    segment: string,
    status: FlightTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.segment = segment;
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

  canMoveTo(next: FlightTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.floorValue + this.sequence) * 100) / 100;
  }

  copy(): FlightTemplate {
    return new FlightTemplate(
      this.code,
      this.name,
      this.channel,
      this.contactEmail,
      this.sequence,
      this.floorValue,
      this.cohort,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a flight template in status idle. */
export function newFlightTemplate(code: string, name: string): FlightTemplate {
  return new FlightTemplate(code, name, "", "", 0, 0, "", "", "idle");
}

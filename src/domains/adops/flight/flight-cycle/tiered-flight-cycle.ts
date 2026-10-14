/**
 * The tiered flight cycle records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered flight cycle is in its life cycle. */
export type TieredFlightCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered flight cycle and its current status. */
export class TieredFlightCycle {
  code: string;
  name: string;
  title: string;
  category: string;
  externalRef: string;
  channel: string;
  windowDays: number;
  source: string;
  country: string;
  sendAt: number;
  weight: number;
  status: TieredFlightCycleStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    category: string,
    externalRef: string,
    channel: string,
    windowDays: number,
    source: string,
    country: string,
    sendAt: number,
    weight: number,
    status: TieredFlightCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.category = category;
    this.externalRef = externalRef;
    this.channel = channel;
    this.windowDays = windowDays;
    this.source = source;
    this.country = country;
    this.sendAt = sendAt;
    this.weight = weight;
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

  canMoveTo(next: TieredFlightCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredFlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.windowDays + this.weight) * 100) / 100;
  }

  copy(): TieredFlightCycle {
    return new TieredFlightCycle(
      this.code,
      this.name,
      this.title,
      this.category,
      this.externalRef,
      this.channel,
      this.windowDays,
      this.source,
      this.country,
      this.sendAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered flight cycle in status idle. */
export function newTieredFlightCycle(code: string, name: string): TieredFlightCycle {
  return new TieredFlightCycle(code, name, "", "", "", "", 0, "", "", 0, 0, "idle");
}

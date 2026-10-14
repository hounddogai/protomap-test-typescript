import * as text from "../../../../kit/text.js";

/** Where a invite profile is in its life cycle. */
export type InviteProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a invite profile and its current status. */
export class InviteProfile {
  code: string;
  title: string;
  attributes: Map<string, string>;
  label: string;
  channel: string;
  locale: string;
  durationMinutes: number;
  rate: number;
  discount: number;
  batchSize: number;
  status: InviteProfileStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    label: string,
    channel: string,
    locale: string,
    durationMinutes: number,
    rate: number,
    discount: number,
    batchSize: number,
    status: InviteProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.label = label;
    this.channel = channel;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.discount = discount;
    this.batchSize = batchSize;
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

  canMoveTo(next: InviteProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: InviteProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.rate + this.discount) * 100) / 100;
  }

  copy(): InviteProfile {
    return new InviteProfile(
      this.code,
      this.title,
      this.attributes,
      this.label,
      this.channel,
      this.locale,
      this.durationMinutes,
      this.rate,
      this.discount,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a invite profile in status idle. */
export function newInviteProfile(code: string, title: string): InviteProfile {
  return new InviteProfile(code, title, new Map<string, string>(), "", "", "", 0, 0, 0, 0, "idle");
}

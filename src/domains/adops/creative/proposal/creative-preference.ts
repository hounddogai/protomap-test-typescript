import * as text from "../../../../kit/text.js";

/** Where a creative preference is in its life cycle. */
export type CreativePreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A creative preference. Its code is unique within a tenant. */
export class CreativePreference {
  code: string;
  label: string;
  name: string;
  openRate: number;
  source: string;
  bid: number;
  revision: number;
  active: boolean;
  channel: string;
  checksum: string;
  status: CreativePreferenceStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    openRate: number,
    source: string,
    bid: number,
    revision: number,
    active: boolean,
    channel: string,
    checksum: string,
    status: CreativePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.openRate = openRate;
    this.source = source;
    this.bid = bid;
    this.revision = revision;
    this.active = active;
    this.channel = channel;
    this.checksum = checksum;
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

  canMoveTo(next: CreativePreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: CreativePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.bid - this.revision) * 100) / 100;
  }

  copy(): CreativePreference {
    return new CreativePreference(
      this.code,
      this.label,
      this.name,
      this.openRate,
      this.source,
      this.bid,
      this.revision,
      this.active,
      this.channel,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a creative preference in status idle. */
export function newCreativePreference(code: string, label: string): CreativePreference {
  return new CreativePreference(code, label, "", 0, "", 0, 0, false, "", "", "idle");
}

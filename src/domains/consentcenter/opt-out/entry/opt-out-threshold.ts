import * as text from "../../../../kit/text.js";

/** Where a opt out threshold is in its life cycle. */
export type OptOutThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One opt out threshold, with what the planners need to act on it. */
export class OptOutThreshold {
  code: string;
  name: string;
  archived: boolean;
  channel: string;
  weight: number;
  status: OptOutThresholdStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    channel: string,
    weight: number,
    status: OptOutThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.channel = channel;
    this.weight = weight;
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

  canMoveTo(next: OptOutThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: OptOutThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): OptOutThreshold {
    return new OptOutThreshold(this.code, this.name, this.archived, this.channel, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a opt out threshold in status requested. */
export function newOptOutThreshold(code: string, name: string): OptOutThreshold {
  return new OptOutThreshold(code, name, false, "", 0, "requested");
}

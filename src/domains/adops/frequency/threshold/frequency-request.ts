import * as text from "../../../../kit/text.js";

/** Where a frequency request is in its life cycle. */
export type FrequencyRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A frequency request as the frequency team keeps it. */
export class FrequencyRequest {
  code: string;
  name: string;
  sendAt: number;
  frequencyCap: number;
  startsAt: number;
  status: FrequencyRequestStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    frequencyCap: number,
    startsAt: number,
    status: FrequencyRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
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

  canMoveTo(next: FrequencyRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FrequencyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"frequency request"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.startsAt + this.frequencyCap) * 100) / 100;
  }

  copy(): FrequencyRequest {
    return new FrequencyRequest(this.code, this.name, this.sendAt, this.frequencyCap, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency request in status requested. */
export function newFrequencyRequest(code: string, name: string): FrequencyRequest {
  return new FrequencyRequest(code, name, 0, 0, 0, "requested");
}

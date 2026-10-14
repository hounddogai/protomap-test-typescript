import * as text from "../../../../kit/text.js";

/** Where a pending frequency request is in its life cycle. */
export type PendingFrequencyRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending frequency request. Its code is unique within a tenant. */
export class PendingFrequencyRequest {
  code: string;
  label: string;
  endsAt: number;
  source: string;
  channel: string;
  segment: string;
  status: PendingFrequencyRequestStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    source: string,
    channel: string,
    segment: string,
    status: PendingFrequencyRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.source = source;
    this.channel = channel;
    this.segment = segment;
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

  canMoveTo(next: PendingFrequencyRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingFrequencyRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending frequency request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): PendingFrequencyRequest {
    return new PendingFrequencyRequest(
      this.code,
      this.label,
      this.endsAt,
      this.source,
      this.channel,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a pending frequency request in status requested. */
export function newPendingFrequencyRequest(code: string, label: string): PendingFrequencyRequest {
  return new PendingFrequencyRequest(code, label, 0, "", "", "", "requested");
}

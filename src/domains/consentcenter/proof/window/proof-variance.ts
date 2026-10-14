import * as text from "../../../../kit/text.js";

/** Where a proof variance is in its life cycle. */
export type ProofVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a proof variance and its current status. */
export class ProofVariance {
  code: string;
  name: string;
  updatedAt: number;
  frequencyCap: number;
  channel: string;
  sequence: number;
  pinned: boolean;
  capacity: number;
  active: boolean;
  status: ProofVarianceStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    frequencyCap: number,
    channel: string,
    sequence: number,
    pinned: boolean,
    capacity: number,
    active: boolean,
    status: ProofVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.sequence = sequence;
    this.pinned = pinned;
    this.capacity = capacity;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"proof variance"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.capacity - this.sequence) * 100) / 100;
  }

  copy(): ProofVariance {
    return new ProofVariance(
      this.code,
      this.name,
      this.updatedAt,
      this.frequencyCap,
      this.channel,
      this.sequence,
      this.pinned,
      this.capacity,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof variance in status proposed. */
export function newProofVariance(code: string, name: string): ProofVariance {
  return new ProofVariance(code, name, 0, 0, "", 0, false, 0, false, "proposed");
}

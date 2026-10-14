import * as text from "../../../../kit/text.js";

/** Where a fallback preference proposal is in its life cycle. */
export type FallbackPreferenceProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback preference proposal, with what the planners need to act on it. */
export class FallbackPreferenceProposal {
  code: string;
  title: string;
  channel: string;
  weight: number;
  unit: string;
  endsAt: number;
  sequence: number;
  updatedAt: number;
  phone: string;
  status: FallbackPreferenceProposalStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    weight: number,
    unit: string,
    endsAt: number,
    sequence: number,
    updatedAt: number,
    phone: string,
    status: FallbackPreferenceProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.weight = weight;
    this.unit = unit;
    this.endsAt = endsAt;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.phone = phone;
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

  canMoveTo(next: FallbackPreferenceProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: FallbackPreferenceProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt + this.sequence) * 100) / 100;
  }

  copy(): FallbackPreferenceProposal {
    return new FallbackPreferenceProposal(
      this.code,
      this.title,
      this.channel,
      this.weight,
      this.unit,
      this.endsAt,
      this.sequence,
      this.updatedAt,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback preference proposal in status idle. */
export function newFallbackPreferenceProposal(code: string, title: string): FallbackPreferenceProposal {
  return new FallbackPreferenceProposal(code, title, "", 0, "", 0, 0, 0, "", "idle");
}

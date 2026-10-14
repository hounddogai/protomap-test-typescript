import * as text from "../../../../kit/text.js";

/** Where a proof claim is in its life cycle. */
export type ProofClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a proof claim and its current status. */
export class ProofClaim {
  code: string;
  label: string;
  priority: number;
  tags: string[];
  notes: string;
  clicks: number;
  cohort: string;
  amount: number;
  country: string;
  summary: string;
  channel: string;
  status: ProofClaimStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    tags: string[],
    notes: string,
    clicks: number,
    cohort: string,
    amount: number,
    country: string,
    summary: string,
    channel: string,
    status: ProofClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.tags = tags;
    this.notes = notes;
    this.clicks = clicks;
    this.cohort = cohort;
    this.amount = amount;
    this.country = country;
    this.summary = summary;
    this.channel = channel;
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

  canMoveTo(next: ProofClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: ProofClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.clicks - this.priority) * 100) / 100;
  }

  copy(): ProofClaim {
    return new ProofClaim(
      this.code,
      this.label,
      this.priority,
      this.tags,
      this.notes,
      this.clicks,
      this.cohort,
      this.amount,
      this.country,
      this.summary,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a proof claim in status idle. */
export function newProofClaim(code: string, label: string): ProofClaim {
  return new ProofClaim(code, label, 0, [], "", 0, "", 0, "", "", "", "idle");
}

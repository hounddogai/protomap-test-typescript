/**
 * The proof checkpoint records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof checkpoint is in its life cycle. */
export type ProofCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** A proof checkpoint as the proof team keeps it. */
export class ProofCheckpoint {
  code: string;
  title: string;
  budget: number;
  channel: string;
  maximum: number;
  openRate: number;
  attributes: Map<string, string>;
  frequencyCap: number;
  ratio: number;
  conversionRate: number;
  score: number;
  status: ProofCheckpointStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    channel: string,
    maximum: number,
    openRate: number,
    attributes: Map<string, string>,
    frequencyCap: number,
    ratio: number,
    conversionRate: number,
    score: number,
    status: ProofCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.channel = channel;
    this.maximum = maximum;
    this.openRate = openRate;
    this.attributes = attributes;
    this.frequencyCap = frequencyCap;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
    this.score = score;
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

  canMoveTo(next: ProofCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ProofCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round(this.frequencyCap * this.conversionRate * 100) / 100;
  }

  copy(): ProofCheckpoint {
    return new ProofCheckpoint(
      this.code,
      this.title,
      this.budget,
      this.channel,
      this.maximum,
      this.openRate,
      this.attributes,
      this.frequencyCap,
      this.ratio,
      this.conversionRate,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof checkpoint in status requested. */
export function newProofCheckpoint(code: string, title: string): ProofCheckpoint {
  return new ProofCheckpoint(code, title, 0, "", 0, 0, new Map<string, string>(), 0, 0, 0, 0, "requested");
}

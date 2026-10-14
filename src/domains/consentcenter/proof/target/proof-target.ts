/**
 * The proof target records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof target is in its life cycle. */
export type ProofTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a proof target and its current status. */
export class ProofTarget {
  code: string;
  title: string;
  maximum: number;
  audienceId: string;
  revision: number;
  channel: string;
  score: number;
  ratio: number;
  batchSize: number;
  status: ProofTargetStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    audienceId: string,
    revision: number,
    channel: string,
    score: number,
    ratio: number,
    batchSize: number,
    status: ProofTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.revision = revision;
    this.channel = channel;
    this.score = score;
    this.ratio = ratio;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.maximum * this.revision * 100) / 100;
  }

  copy(): ProofTarget {
    return new ProofTarget(
      this.code,
      this.title,
      this.maximum,
      this.audienceId,
      this.revision,
      this.channel,
      this.score,
      this.ratio,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof target in status draft. */
export function newProofTarget(code: string, title: string): ProofTarget {
  return new ProofTarget(code, title, 0, "", 0, "", 0, 0, 0, "draft");
}

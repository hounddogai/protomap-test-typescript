import * as text from "../../../../kit/text.js";

/** Where a queue proposal is in its life cycle. */
export type QueueProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a queue proposal and its current status. */
export class QueueProposal {
  code: string;
  name: string;
  source: string;
  ratio: number;
  attributes: Map<string, string>;
  expiresAt: number;
  utmSource: string;
  segment: string;
  status: QueueProposalStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    ratio: number,
    attributes: Map<string, string>,
    expiresAt: number,
    utmSource: string,
    segment: string,
    status: QueueProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.ratio = ratio;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.segment = segment;
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

  canMoveTo(next: QueueProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: QueueProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue proposal"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.expiresAt + this.ratio) * 100) / 100;
  }

  copy(): QueueProposal {
    return new QueueProposal(
      this.code,
      this.name,
      this.source,
      this.ratio,
      this.attributes,
      this.expiresAt,
      this.utmSource,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a queue proposal in status draft. */
export function newQueueProposal(code: string, name: string): QueueProposal {
  return new QueueProposal(code, name, "", 0, new Map<string, string>(), 0, "", "", "draft");
}

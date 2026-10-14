import * as text from "../../../../kit/text.js";

/** Where a creative target is in its life cycle. */
export type CreativeTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative target as the creative team keeps it. */
export class CreativeTarget {
  code: string;
  label: string;
  updatedAt: number;
  contactEmail: string;
  source: string;
  score: number;
  version: number;
  externalRef: string;
  summary: string;
  threshold: number;
  status: CreativeTargetStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    contactEmail: string,
    source: string,
    score: number,
    version: number,
    externalRef: string,
    summary: string,
    threshold: number,
    status: CreativeTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.source = source;
    this.score = score;
    this.version = version;
    this.externalRef = externalRef;
    this.summary = summary;
    this.threshold = threshold;
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

  canMoveTo(next: CreativeTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreativeTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.threshold + this.updatedAt) * 100) / 100;
  }

  copy(): CreativeTarget {
    return new CreativeTarget(
      this.code,
      this.label,
      this.updatedAt,
      this.contactEmail,
      this.source,
      this.score,
      this.version,
      this.externalRef,
      this.summary,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a creative target in status requested. */
export function newCreativeTarget(code: string, label: string): CreativeTarget {
  return new CreativeTarget(code, label, 0, "", "", 0, 0, "", "", 0, "requested");
}

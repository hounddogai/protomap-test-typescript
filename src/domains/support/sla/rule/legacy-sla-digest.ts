import * as text from "../../../../kit/text.js";

/** Where a legacy sla digest is in its life cycle. */
export type LegacySlaDigestStatus = "created" | "validated" | "published" | "retired";

/** A legacy sla digest as the sla team keeps it. */
export class LegacySlaDigest {
  code: string;
  label: string;
  version: number;
  summary: string;
  discount: number;
  openRate: number;
  sequence: number;
  status: LegacySlaDigestStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    summary: string,
    discount: number,
    openRate: number,
    sequence: number,
    status: LegacySlaDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.summary = summary;
    this.discount = discount;
    this.openRate = openRate;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacySlaDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacySlaDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sla digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"legacy sla digest"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.version * this.openRate * 100) / 100;
  }

  copy(): LegacySlaDigest {
    return new LegacySlaDigest(
      this.code,
      this.label,
      this.version,
      this.summary,
      this.discount,
      this.openRate,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy sla digest in status created. */
export function newLegacySlaDigest(code: string, label: string): LegacySlaDigest {
  return new LegacySlaDigest(code, label, 0, "", 0, 0, 0, "created");
}

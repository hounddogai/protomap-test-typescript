import * as text from "../../../../kit/text.js";

/** Where a complaint notice is in its life cycle. */
export type ComplaintNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A complaint notice as the complaint team keeps it. */
export class ComplaintNotice {
  code: string;
  name: string;
  externalRef: string;
  sequence: number;
  batchSize: number;
  ownerId: string;
  checksum: string;
  weight: number;
  label: string;
  tags: string[];
  variant: string;
  status: ComplaintNoticeStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    sequence: number,
    batchSize: number,
    ownerId: string,
    checksum: string,
    weight: number,
    label: string,
    tags: string[],
    variant: string,
    status: ComplaintNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.weight = weight;
    this.label = label;
    this.tags = tags;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ComplaintNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ComplaintNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round(this.weight * this.sequence * 100) / 100;
  }

  copy(): ComplaintNotice {
    return new ComplaintNotice(
      this.code,
      this.name,
      this.externalRef,
      this.sequence,
      this.batchSize,
      this.ownerId,
      this.checksum,
      this.weight,
      this.label,
      this.tags,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint notice in status open. */
export function newComplaintNotice(code: string, name: string): ComplaintNotice {
  return new ComplaintNotice(code, name, "", 0, 0, "", "", 0, "", [], "", "open");
}

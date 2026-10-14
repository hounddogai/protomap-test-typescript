import * as text from "../../../../kit/text.js";

/** Where a adaptive sender request is in its life cycle. */
export type AdaptiveSenderRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive sender request as the sender team keeps it. */
export class AdaptiveSenderRequest {
  code: string;
  title: string;
  weight: number;
  segment: string;
  margin: number;
  status: AdaptiveSenderRequestStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    segment: string,
    margin: number,
    status: AdaptiveSenderRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.segment = segment;
    this.margin = margin;
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

  canMoveTo(next: AdaptiveSenderRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSenderRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sender request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.margin) * 100) / 100;
  }

  copy(): AdaptiveSenderRequest {
    return new AdaptiveSenderRequest(this.code, this.title, this.weight, this.segment, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive sender request in status draft. */
export function newAdaptiveSenderRequest(code: string, title: string): AdaptiveSenderRequest {
  return new AdaptiveSenderRequest(code, title, 0, "", 0, "draft");
}

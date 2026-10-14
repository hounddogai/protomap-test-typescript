import * as text from "../../../../kit/text.js";

/** Where a default touchpoint agreement is in its life cycle. */
export type DefaultTouchpointAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default touchpoint agreement as the touchpoint team keeps it. */
export class DefaultTouchpointAgreement {
  code: string;
  title: string;
  batchSize: number;
  reviewer: string;
  weight: number;
  capacity: number;
  openRate: number;
  status: DefaultTouchpointAgreementStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    reviewer: string,
    weight: number,
    capacity: number,
    openRate: number,
    status: DefaultTouchpointAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.reviewer = reviewer;
    this.weight = weight;
    this.capacity = capacity;
    this.openRate = openRate;
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

  canMoveTo(next: DefaultTouchpointAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultTouchpointAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default touchpoint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.batchSize + this.weight) * 100) / 100;
  }

  copy(): DefaultTouchpointAgreement {
    return new DefaultTouchpointAgreement(
      this.code,
      this.title,
      this.batchSize,
      this.reviewer,
      this.weight,
      this.capacity,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default touchpoint agreement in status draft. */
export function newDefaultTouchpointAgreement(code: string, title: string): DefaultTouchpointAgreement {
  return new DefaultTouchpointAgreement(code, title, 0, "", 0, 0, 0, "draft");
}

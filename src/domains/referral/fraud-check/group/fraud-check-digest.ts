import * as text from "../../../../kit/text.js";

/** Where a fraud check digest is in its life cycle. */
export type FraudCheckDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One fraud check digest, with what the planners need to act on it. */
export class FraudCheckDigest {
  code: string;
  name: string;
  reviewer: string;
  summary: string;
  weight: number;
  variant: string;
  status: FraudCheckDigestStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    summary: string,
    weight: number,
    variant: string,
    status: FraudCheckDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.summary = summary;
    this.weight = weight;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FraudCheckDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fraud check digest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): FraudCheckDigest {
    return new FraudCheckDigest(
      this.code,
      this.name,
      this.reviewer,
      this.summary,
      this.weight,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fraud check digest in status planned. */
export function newFraudCheckDigest(code: string, name: string): FraudCheckDigest {
  return new FraudCheckDigest(code, name, "", "", 0, "", "planned");
}

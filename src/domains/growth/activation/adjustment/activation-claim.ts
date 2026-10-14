import * as text from "../../../../kit/text.js";

/** Where a activation claim is in its life cycle. */
export type ActivationClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A activation claim as the activation team keeps it. */
export class ActivationClaim {
  code: string;
  label: string;
  unit: string;
  attributes: Map<string, string>;
  weight: number;
  revision: number;
  category: string;
  title: string;
  summary: string;
  amount: number;
  status: ActivationClaimStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    attributes: Map<string, string>,
    weight: number,
    revision: number,
    category: string,
    title: string,
    summary: string,
    amount: number,
    status: ActivationClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.attributes = attributes;
    this.weight = weight;
    this.revision = revision;
    this.category = category;
    this.title = title;
    this.summary = summary;
    this.amount = amount;
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

  canMoveTo(next: ActivationClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
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
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ActivationClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.weight - this.revision) * 100) / 100;
  }

  copy(): ActivationClaim {
    return new ActivationClaim(
      this.code,
      this.label,
      this.unit,
      this.attributes,
      this.weight,
      this.revision,
      this.category,
      this.title,
      this.summary,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a activation claim in status draft. */
export function newActivationClaim(code: string, label: string): ActivationClaim {
  return new ActivationClaim(code, label, "", new Map<string, string>(), 0, 0, "", "", "", 0, "draft");
}

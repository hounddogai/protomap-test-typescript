import * as text from "../../../../kit/text.js";

/** Where a insight manifest is in its life cycle. */
export type InsightManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A insight manifest as the insight team keeps it. */
export class InsightManifest {
  code: string;
  name: string;
  variant: string;
  capacity: number;
  tags: string[];
  phone: string;
  contactEmail: string;
  startsAt: number;
  quantity: number;
  batchSize: number;
  weight: number;
  status: InsightManifestStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    capacity: number,
    tags: string[],
    phone: string,
    contactEmail: string,
    startsAt: number,
    quantity: number,
    batchSize: number,
    weight: number,
    status: InsightManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.capacity = capacity;
    this.tags = tags;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: InsightManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): InsightManifest {
    return new InsightManifest(
      this.code,
      this.name,
      this.variant,
      this.capacity,
      this.tags,
      this.phone,
      this.contactEmail,
      this.startsAt,
      this.quantity,
      this.batchSize,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a insight manifest in status proposed. */
export function newInsightManifest(code: string, name: string): InsightManifest {
  return new InsightManifest(code, name, "", 0, [], "", "", 0, 0, 0, 0, "proposed");
}
